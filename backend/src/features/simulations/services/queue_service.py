"""Database-backed, retryable simulation queue."""
from flask import current_app
import threading

queue_lock = threading.RLock()


def _mysql():
    return current_app.config.get('mysql') or current_app.mysql


def _compact_queue_unlocked(mysql):
    cur = mysql.connection.cursor()
    cur.execute("SELECT id FROM simulation WHERE p_status = 'Queued' ORDER BY COALESCE(queue_order, id), id")
    ids = [row[0] for row in cur.fetchall()]
    for position, sim_id in enumerate(ids, 1):
        cur.execute("UPDATE simulation SET queue_order = %s WHERE id = %s AND p_status = 'Queued'", (position, sim_id))
    mysql.connection.commit()
    cur.close()
    try:
        from ..services.simulations_service import notificar_estado_simulacion
        for position, sim_id in enumerate(ids, 1):
            notificar_estado_simulacion(sim_id, 'Queued', queue_position=position)
    except Exception as exc:
        print(f"Queue websocket notification failed: {exc}")


def compact_queue():
    with queue_lock:
        _compact_queue_unlocked(_mysql())


def get_active_simulations_count():
    cur = _mysql().connection.cursor()
    cur.execute("SELECT COUNT(*) FROM simulation WHERE p_status IN ('Running', 'Aborting')")
    count = cur.fetchone()[0]
    cur.close()
    return count


def should_queue_simulation():
    return get_active_simulations_count() > 0


def get_queue_position(sim_id):
    sim_id = int(sim_id)
    cur = _mysql().connection.cursor()
    cur.execute("SELECT id FROM simulation WHERE p_status = 'Queued' ORDER BY COALESCE(queue_order, id), id")
    ids = [row[0] for row in cur.fetchall()]
    cur.close()
    return ids.index(sim_id) + 1 if sim_id in ids else None


def get_next_queued_simulation():
    cur = _mysql().connection.cursor()
    cur.execute("SELECT id FROM simulation WHERE p_status = 'Queued' ORDER BY COALESCE(queue_order, id), id LIMIT 1")
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def queue_simulation(sim_id):
    """Persist an idempotent enqueue. Queue order is the source of truth."""
    sim_id = int(sim_id)
    with queue_lock:
        mysql = _mysql()
        cur = mysql.connection.cursor()
        cur.execute("SELECT p_status, queue_order FROM simulation WHERE id = %s FOR UPDATE", (sim_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            return False
        if row[0] == 'Queued':
            cur.close()
            return True
        if row[0] in ('Running', 'Aborting'):
            cur.close()
            return False
        cur.close()
        cur = mysql.connection.cursor()
        cur.execute("SELECT GREATEST(COALESCE(MAX(queue_order), 0), COUNT(*)) + 1 FROM simulation WHERE p_status = 'Queued'")
        position = cur.fetchone()[0]
        cur.execute("UPDATE simulation SET p_status = 'Queued', queue_order = %s, task_id = NULL WHERE id = %s", (position, sim_id))
        mysql.connection.commit()
        cur.close()
        try:
            from ..services.simulations_service import notificar_estado_simulacion
            notificar_estado_simulacion(sim_id, 'Queued', queue_position=position)
        except Exception as exc:
            print(f"Queue websocket notification failed: {exc}")
        return True


def dequeue_simulation(sim_id):
    with queue_lock:
        mysql = _mysql()
        cur = mysql.connection.cursor()
        cur.execute("UPDATE simulation SET p_status = 'Not started', queue_order = NULL, task_id = NULL WHERE id = %s AND p_status = 'Queued'", (sim_id,))
        changed = cur.rowcount == 1
        mysql.connection.commit()
        cur.close()
        if changed:
            _compact_queue_unlocked(mysql)
        return (changed, 'Simulación desencolada exitosamente' if changed else 'La simulación no está en cola')


def process_next_in_queue():
    """Claim and dispatch at most one item; failed broker publishes remain queued."""
    with queue_lock:
        mysql = _mysql()
        lock_cur = mysql.connection.cursor()
        lock_cur.execute("SELECT GET_LOCK('bdat_simulation_dispatch', 5)")
        acquired = lock_cur.fetchone()
        lock_cur.close()
        if not acquired or acquired[0] != 1:
            return False
        try:
            if get_active_simulations_count():
                return False

            cur = mysql.connection.cursor()
            cur.execute("""
                SELECT id, n_transmitter, n_receiver, emitters_pitch, receivers_pitch,
                       sensor_edge_margin, typical_mesh_size, sensor_distance, plate_thickness,
                       porosity, plate_length, attenuation, mesh_type, xml_file,
                       skin_layer_config, skin_thickness_top, skin_thickness_bottom, roughness
                FROM simulation WHERE p_status = 'Queued'
                ORDER BY COALESCE(queue_order, id), id LIMIT 1 FOR UPDATE
            """)
            row = cur.fetchone()
            if not row:
                cur.close()
                return False

            sim_id = row[0]
            params = {
                'n_transmitter': row[1], 'n_receiver': row[2], 'emitters_pitch': row[3],
                'receivers_pitch': row[4], 'sensor_edge_margin': row[5], 'typical_mesh_size': row[6],
                'sensor_distance': row[7], 'plate_thickness': row[8], 'porosity': row[9],
                'plate_length': row[10], 'attenuation': row[11], 'mesh_type': row[12] or 'gmsh',
                'xml_file': row[13], 'skin_layer_config': row[14] or 'none',
                'skin_thickness_top': float(row[15]) if row[15] is not None else 1.3,
                'skin_thickness_bottom': float(row[16]) if row[16] is not None else 1.3,
                'roughness': float(row[17]) if row[17] is not None else 0.2,
            }
            import os
            if not params['xml_file'] or not os.path.exists(params['xml_file']):
                cur.execute("UPDATE simulation SET p_status='Error', finish_datetime=UTC_TIMESTAMP(), queue_order=NULL WHERE id=%s AND p_status='Queued'", (sim_id,))
                mysql.connection.commit()
                cur.close()
                from ..services.simulations_service import notificar_estado_simulacion
                notificar_estado_simulacion(sim_id, 'Error')
                return True

            from datetime import datetime
            task_id = f"simulation_{sim_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}"
            cur.execute("""
                UPDATE simulation SET p_status='Running', task_id=%s, start_datetime=UTC_TIMESTAMP(), queue_order=NULL
                WHERE id=%s AND p_status='Queued'
            """, (task_id, sim_id))
            if cur.rowcount != 1:
                mysql.connection.rollback()
                cur.close()
                return False
            mysql.connection.commit()
            cur.close()
            _compact_queue_unlocked(mysql)

            from ..services.simulations_service import notificar_estado_simulacion
            notificar_estado_simulacion(sim_id, 'Running')
            try:
                from app import celery
                celery.send_task('simulations.run_simulation', args=[sim_id, params], task_id=task_id)
            except Exception as exc:
                cur = mysql.connection.cursor()
                cur.execute("""
                    UPDATE simulation SET p_status='Queued', task_id=NULL, start_datetime=NULL,
                        queue_order=1 WHERE id=%s AND p_status='Running' AND task_id=%s
                """, (sim_id, task_id))
                mysql.connection.commit()
                cur.close()
                _compact_queue_unlocked(mysql)
                notificar_estado_simulacion(sim_id, 'Queued', queue_position=1)
                print(f"Celery unavailable; simulation {sim_id} returned to queue: {exc}")
                return False
            return True
        except Exception as exc:
            print(f"Error dispatching simulation queue: {exc}")
            mysql.connection.rollback()
            task_id = locals().get('task_id')
            sim_id = locals().get('sim_id')
            if task_id and sim_id:
                try:
                    cur = mysql.connection.cursor()
                    cur.execute("""UPDATE simulation SET p_status='Queued', task_id=NULL,
                        start_datetime=NULL, queue_order=1
                        WHERE id=%s AND p_status='Running' AND task_id=%s""", (sim_id, task_id))
                    mysql.connection.commit()
                    cur.close()
                    _compact_queue_unlocked(mysql)
                except Exception as recovery_error:
                    mysql.connection.rollback()
                    print(f"Could not recover claimed simulation {sim_id}: {recovery_error}")
            return False
        finally:
            cur = mysql.connection.cursor()
            cur.execute("SELECT RELEASE_LOCK('bdat_simulation_dispatch')")
            cur.fetchone()
            cur.close()


def reorder_queue(ordered_ids):
    with queue_lock:
        mysql = _mysql()
        cur = mysql.connection.cursor()
        if not ordered_ids:
            cur.close()
            return False
        placeholders = ','.join(['%s'] * len(ordered_ids))
        cur.execute(f"SELECT id FROM simulation WHERE id IN ({placeholders}) AND p_status='Queued'", tuple(ordered_ids))
        if set(row[0] for row in cur.fetchall()) != set(ordered_ids):
            cur.close()
            return False
        for position, sim_id in enumerate(ordered_ids, 1):
            cur.execute("UPDATE simulation SET queue_order=%s WHERE id=%s AND p_status='Queued'", (position, sim_id))
        mysql.connection.commit()
        cur.close()
        _compact_queue_unlocked(mysql)
        return True
