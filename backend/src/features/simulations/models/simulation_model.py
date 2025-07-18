# Modelo y funciones de acceso a datos para la entidad simulation

def insert_simulation(mysql, sim_data):
    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO simulation (
            sim_name, n_transmitter, n_receiver, emitters_pitch, receivers_pitch,
            sensor_distance, sensor_edge_margin, typical_mesh_size, plate_thickness,
            plate_length, porosity, attenuation, p_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, sim_data)
    mysql.connection.commit()
    sim_id = cur.lastrowid
    cur.execute("SELECT * FROM simulation WHERE id = %s", (sim_id,))
    doc = cur.fetchone()
    cur.close()
    return doc

def get_all_simulations(mysql):
    cur = mysql.connection.cursor()
    cur.execute('SELECT * FROM simulation ORDER BY id DESC')
    data = cur.fetchall()
    cur.close()
    return data

def delete_simulation(mysql, sim_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM simulation WHERE id = %s", (sim_id,))
    mysql.connection.commit()
    cur.close()

def get_simulation_by_id(mysql, sim_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM simulation WHERE id = %s", (sim_id,))
    data = cur.fetchall()
    cur.close()
    return data

def get_simulation_by_porosity(mysql, poro):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM simulation WHERE porosity = %s", (poro,))
    data = cur.fetchall()
    cur.close()
    return data

def get_simulation_by_distance(mysql, distance):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM simulation WHERE distance like %s", (f"%{distance}%",))
    data = cur.fetchall()
    cur.close()
    return data

def get_simulation_file(mysql, sim_id):
    cur = mysql.connection.cursor()
    cur.execute("select image, result_step_01 from simulation WHERE id = %s", (sim_id,))
    data = cur.fetchone()
    cur.close()
    return data

def update_simulation_status(mysql, sim_id, status):
    cur = mysql.connection.cursor()
    cur.execute("UPDATE simulation SET p_status = %s WHERE id = %s;", (status, sim_id))
    mysql.connection.commit()
    cur.close()

def update_simulation_result(mysql, sim_id, filename, status, time, file):
    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE simulation
        SET result_step_01 = %s, p_status = %s, time = %s, image = %s
        WHERE id = %s;
    """, (filename, status, time, file, sim_id))
    mysql.connection.commit()
    cur.close()

def get_simulation_count_running(mysql):
    cur = mysql.connection.cursor()
    cur.execute("SELECT count(*) FROM simulation where p_status = 1")
    data = cur.fetchone()
    cur.close()
    return data 