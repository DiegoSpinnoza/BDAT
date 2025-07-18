from dolfin import *
from mshr import *
import scipy.io as sio
import numpy as np
from datetime import datetime
import time
import pandas as pd
from ufl import Identity, indices, as_tensor, imag, real
import math

#import multiprocessing


def fmain (n_transmitter, n_receiver, distance, emitter_pitch, receiver_pitch, sensor_edge_margin, typical_mesh_size, plate_thickness, plate_size, sensor_width, porosity, attenuation, id):
    
    Hora_inicio = datetime.now()

    print('Parametros: ', n_transmitter, n_receiver, distance, emitter_pitch, receiver_pitch, sensor_edge_margin, typical_mesh_size, plate_thickness, plate_size, sensor_width, porosity, attenuation, id)

    # Obtain the experimental data from .mat file
    # Obtain the experimental data from .mat file
    C_mathilde = sio.loadmat(r"src/features/simulations/services/Reidmen/Reidmen Fenics/ipnyb propagation/Files_mat/C_values_mathilde.mat")

    # Define the constants
    # The stiffness constants in [GPa] --> [g/mm(\mu sec)^2]
    # are given by the mathilde .mat file of 5%
    #print('WITH ATTENUATION')

    """______________________C AND D VALUES FROM ATTENUATION.CSV______________________
    path = 'src/Reidmen Fenics/ipnyb propagation/Files_mat/attenuation'
    M = pd.read_csv(path + '.csv').values
    # First dimension: porosity
    p = np.arange(0.01, 0.48, 0.01)
    d = 2.03 * (1 - p) + p

    # Calculate omega
    frequency = 1e-3 # frequency value
    omega = 2 * np.pi * frequency
    # Second dimensioncl
    C22 = M[:, 0] # %=C11
    C66 = M[:, 1]
    C33 = M[:, 2]
    C23 = M[:, 3] # %=C13
    C55 = M[:, 4] # %=C44
    C12 = M[:, 5]

    D11 = M[:, 6]
    D66 = M[:, 7]
    D33 = M[:, 8]
    D13 = M[:, 9]
    D55 = M[:, 10]
    D12 = M[:, 11] 

    C11 = C22 + D11
    C13 = C23 + D13
    C66 = C66 + D66
    C33 = C33 + D33
    C55 = C55 + D55
    C12 = C12 + D12
    """

    """______________________C VALUES FROM MATHILDE______________________"""
    C11 = np.reshape(C_mathilde['C11'], (30,))*1E-3
    C12 = np.reshape(C_mathilde['C12'], (30,))*1E-3
    C13 = np.reshape(C_mathilde['C13'], (30,))*1E-3
    C33 = np.reshape(C_mathilde['C33'], (30,))*1E-3
    C55 = np.reshape(C_mathilde['C55'], (30,))*1E-3
    C66 = np.reshape(C_mathilde['C66'], (30,))*1E-3

    d = np.reshape(C_mathilde['d'], (30,))*1E-3
    C_mathilde.keys()

    """______________________PARAMS______________________"""
    
    # Rectangle geometry limits
    zlim=(2*sensor_edge_margin) + (n_transmitter*emitter_pitch) + distance + (n_receiver*receiver_pitch)
    ylim = plate_thickness

    # Porosity level from Mathilde data 
    # this data starts from 1% porosity values!
    por = porosity - 1# the porosity level is por+1
    
    # Define domain size 
    dxt = typical_mesh_size 
    size =  round(zlim/dxt) # Dato importante
    
    # generate f and create mesh
    domain = Rectangle(Point(0., 0.), Point(zlim, ylim))
    mesh = generate_mesh(domain, size)

    # Compute the minimum height diameter
    print("Minimum height of element [mm]: ", mesh.hmin())

    # Define source locations
    # Using notation consistent with the 3D-case
    nsous = n_transmitter#1 #Cantidad de emisores
    zsous = np.linspace(sensor_edge_margin, sensor_edge_margin + ((n_transmitter-1) * emitter_pitch), num=n_transmitter)
    ysous =  nsous*[ylim*1,]

    # Position of sensor to obtain the force!
    nsens = n_receiver#1# Number of sensors separated at 0.4081 mm # RECEPTORES
    zsens = np.linspace(sensor_edge_margin + n_transmitter * emitter_pitch + distance, sensor_edge_margin+ n_transmitter*emitter_pitch+distance + (n_receiver-1)*receiver_pitch, num=nsens)
    ysens = nsens*[ylim*1,]

    # Parameters of Source definition
    eps = DOLFIN_EPS
    width = 0.9 * emitter_pitch #antes era 0.5 sens_width
    
    """# Rectangle geometry limits
    zlim, ylim = 70., 2.8
    # Porosity level from Mathilde data 
    # this data starts from 1% porosity values!
    por = porosity - 1# the porosity level is por+1
    # Define domain size 
    size = 400
    # generate f and create mesh
    domain = Rectangle(Point(0., 0.), Point(zlim, ylim))
    mesh = generate_mesh(domain, size)
    # Compute the minimum height diameter
    print("Minimum height of element [mm]: ", mesh.hmin())
    #File("Domains/2DMesh.pvd") << mesh

    # Define source locations
    # Using notation consistent with the 3D-case
    nsous = 8
    zsous, ysous = [n for n in range(10, 25, 2)], nsous*[ylim,]
    # Position of sensor to obtain the force!
    nsens = 50# Number of sensors separated at 0.4081 mm
    zsens, ysens = np.arange(35, 55, step=0.4), nsens*[ylim,]
    # Parameters of Source definition
    eps = DOLFIN_EPS
    width = 0.5
    """
    """______________________DOMAINS______________________"""
    # Define domain for each source
    class DomSource_1(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[0]) < width + eps and
                    abs(x[1] - ysous[0]) < width + eps and
                    on_boundary)

    class DomSource_2(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[1]) < width + eps and
                    abs(x[1] - ysous[1]) < width + eps and
                    on_boundary)

    class DomSource_3(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[2]) < width + eps and
                    abs(x[1] - ysous[2]) < width + eps and
                    on_boundary)

    class DomSource_4(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[3]) < width + eps and
                    abs(x[1] - ysous[3]) < width + eps and
                    on_boundary)

    class DomSource_5(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[4]) < width + eps and
                    abs(x[1] - ysous[4]) < width + eps and
                    on_boundary)

    class DomSource_6(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[5]) < width + eps and
                    abs(x[1] - ysous[5]) < width + eps and
                    on_boundary)

    class DomSource_7(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[6]) < width + eps and
                    abs(x[1] - ysous[6]) < width + eps and
                    on_boundary)

    class DomSource_8(SubDomain):
        def inside(self, x, on_boundary):
            return (abs(x[0] - zsous[7]) < width + eps and
                    abs(x[1] - ysous[7]) < width + eps and
                   on_boundary)
    
    # Define source expression
    class Source(UserExpression):
        def __init__(self, freq, freq_0,
                    sig_freq, osc, 
                    degree=1, **kwargs):
            super().__init__(**kwargs)
            # initialize atributes
            self.freq, self.freq_0 = freq, freq_0
            self.sig_freq = sig_freq
            self.osc = osc
        
        def eval(self, values, x):
            ## Case using Fourier transform with -2*pi on the oscilation
            t_0 = 5.0 # [\mu s]
            sig2 = pow(self.sig_freq,2)
            pi2 = pow(pi,2)
            sum_freq = (self.freq_0 + self.freq)
            dif_freq = (self.freq_0 - self.freq)
            # Type of oscillation to consider
            if self.osc == "cos":
                factor = sqrt(pi*sig2/2)*cos(-2*pi*self.freq*self.freq_0)
            else:
                factor = sqrt(pi*sig2/2)*sin(-2*pi*self.freq*self.freq_0)
            # Obtaining left side and right sides
            num_ls = exp(-2*sig2*pi2*pow(sum_freq,2))
            num_rs = exp(-2*sig2*pi2*pow(dif_freq,2))
            values[0] = 0.0 # the horizontal direction
            values[1] = -factor*(num_ls+num_rs) # vertical direction
                
        def value_shape(self):
            return (2,)

    class Attenuation(UserExpression):
        def __init__(self, epsilon, zlim, ylim, degree=1):
            super().__init__()
            # Define constant factor for epsilon
            self._eps = epsilon
            # Define limits of geometry for damping
            self._ylim = ylim
            self._zlim = zlim
            
        def eval(self, values, x):
            # If we are in the main geometry
            if x[0] > 0.0 or x[0] < self._zlim:
                values[0] = self._eps
            # If we are outside the interest zone
            else:
                if x[0] < 0.0 + DOLFIN_EPS:
                    values[0] = self._eps*(1+np.abs(x[0]))
                else:
                    values[0] = self._eps*(1+np.abs(x[0]-self._zlim))
        def value_shape(self):
            return ()
    
    print("Number of Cells; {0}, of Vertice: {1}".format(mesh.num_cells(),
                                                    mesh.num_vertices()))
    
    # Mark boundaries with label 0
    boundaries = MeshFunction("size_t", mesh, mesh.topology().dim()-1)
    boundaries.set_all(0)

    # Mark boundaries (whenever necessary)
    # Mark domain sources with 2
    dom = {
        'DomSource_1':DomSource_1,
        'DomSource_2':DomSource_2,
        'DomSource_3':DomSource_3,
        'DomSource_4':DomSource_4,
        'DomSource_5':DomSource_5,
        'DomSource_6':DomSource_6,
        'DomSource_7':DomSource_7,
        'DomSource_8':DomSource_8

    }
    for i in range(nsous):
        name = "DomSource_"+str(i+1)
        func = dom[name]
        func().mark(boundaries, 20+i+1)

    # Define new measure for boundaries
    global dx
    global ds
    dx = dx(domain=mesh)
    ds = ds(domain=mesh, subdomain_data=boundaries)

    # Define mixed function space with boundary conditions
    pdim = 1
    V = VectorElement("CG", mesh.ufl_cell(), pdim)
    V_element = MixedElement([V, V])
    W = FunctionSpace(mesh, V_element)
    # Define a constant function space for parameters
    P = FunctionSpace(mesh, 'DG', 0)

    # Define boundaries over the function space
    # In the variational form are defined the Neumann conditions
    left_jit = "on_boundary && near(x[0], 0.)"
    bc_0 = DirichletBC(W.sub(0), Constant((0.,0.)), left_jit)
    bc_1 = DirichletBC(W.sub(1), Constant((0.,0.)), left_jit)


    # Define kronecker delta in 2D and indices
    delta = Identity(2)
    i,j,k,l = indices(4)

    # Define strain tensor
    def strain(u): 
        return as_tensor(0.5*(u[i].dx(j)+u[j].dx(i)),
                    (i,j))

    # Define stiffness tensor C_{i,j,k,l} transverse isotropic
    def VoigtToTensor(A):
        # We use the convention, for long axis 1
        # Upper diagonal part
        A11, A13, A15 = A[0,0], A[0,1], A[0,2]
        A33, A35 = A[1,1], A[1,2]
        A55 = A[2,2]
        # Lower diagonal part (symmetric)
        A31, A51 = A13, A15
        A53 = A35
        
        return as_tensor([\
            [\
                [ [A11, A15], [A15, A13]] ,\
                [ [A51, A55], [A55, A53]] \
            ], \
            [
                [ [A51, A55], [A55, A53]] ,\
                [ [A31, A35], [A35, A33]] \
            ] \
                        ])
    
    """_____________________C VALUES_____________________"""
    # We take the standard density
    rho = d[por] # [g/cm^3] --> [g/(mm)^3]
    # Define the Voigt matrix representing the tensor
    # Here, the 3-axis is the z-axis, and
    # 1-axis in the y-axis or x-axis by the simmetry
    C_voigt = np.array([\
                    [C33[por], C13[por], 0], \
                    [C13[por], C11[por], 0], \
                    [0, 0, C55[por]] 
                    ])
    # Obtain the stiffness tensor
    C = VoigtToTensor(C_voigt)

    """_____________________D VALUES_____________________
    # We take the standard density
    rho = d[por] # [g/cm^3] --> [g/(mm)^3]
    # Define the Voigt matrix representing the tensor
    # Here, the 3-axis is the z-axis, and
    # 1-axis in the y-axis or x-axis by the simmetry
    D_voigt = np.array([\
                    [D33[por], D13[por], 0], \
                    [D13[por], D11[por], 0], \
                    [0, 0, D55[por]] 
                    ])
    # Obtain the stiffness tensor
    D = VoigtToTensor(D_voigt)
    """
    """_____________________FUNCTIONS_____________________"""
    # Define stress tensor
    def sigma(u):
        return as_tensor(C[i,j,k,l]*strain(u)[k,l], (i,j))

    # Define the three main blocks in variational forms
    def o_block(u, v, omega):
        return -rho*pow(omega,2)*inner(u, v)*dx
        #return -rho*pow(omega,2)*inner(grad(imag(u)), grad(imag(v))) * dx

    def eps_block(u, v, f, damping):
        return damping*f*inner(u, v)*dx

    def A_block(u, v):
        return inner(sigma(u), grad(v))*dx

    def b_block(source, v, bdry_id):
        return dot(source, v)*ds(bdry_id)

    """_____________________INFO_____________________"""
    # Print number of point at the boundary
    #print("Total number of points at the boundary", 
    #    len(bc_domain.get_boundary_values()))

    # Check the points where the force is applied
    #mesh_points = SubsetIterator(boundaries, 28)
    #print("Midpoints where the force is applied")
    for ii in range(nsous):
        idx = int(ii + 21)
        count = sum(1 for _ in SubsetIterator(boundaries,idx))
    print("Facet marked as %d have %d points" % (idx, count))
    
    # Check if the points a the left have been taken.
    print("Points at boundary left(): ", 
        len(bc_0.get_boundary_values()))

    """________________START________________"""
    # Frequency array to consider
    freqs = np.arange(0., 2., step=20/2048)# ~ [MHz], step=20/2048
    omegas = 2*pi*freqs

    # Define number of frequencies
    nfreq = freqs.shape[0]

    ## Iterate of freq. and solution saving for a point sensor
    # Define trial and test functions
    (u_r, u_i) = TrialFunctions(W)
    (v_r, v_i) = TestFunctions(W)

    # list all boundaries
    bcs = [bc_0, bc_1]

    # Define sensors arrays
    # Define sensors arrays for real and imaginary parts
    solR_sensors_z = np.zeros((nsens, nfreq, nsous))
    solR_sensors_y = np.zeros((nsens, nfreq, nsous))
    solI_sensors_z = np.zeros((nsens, nfreq, nsous))
    solI_sensors_y = np.zeros((nsens, nfreq, nsous))
        
    # Define parameter for the imaginary part
    # epsilon = 0.5E-3 # TEST!

    tau0 = 0.02
    B = 0.133;   # = 0.04 / 0.3

    tau = (5/10) * (tau0 + B * (por+1)/100)/100

    # Iteration over each frequency
    for idx_i in range(nfreq):

        
        ## Define Neumann boundary condition for source 
        freq, freq_0 = float(freqs[idx_i]), 1 # ~ 0.5 [MHz] ---------------------------------------------------------
        # Define general variance
        epsilon = (tau) * freq * 2 * pi
        sig_freq = 0.6 # sig_time ~ 0.7 [Mhz] 
        exp_R = Source(freq=freq, freq_0=freq_0,
                    sig_freq=sig_freq, osc="cos",
                    degree=1)
        exp_I = Source(freq=freq, freq_0=freq_0,
                    sig_freq=sig_freq, osc="sin",
                    degree=1)
        # Interpolate source over domain
        src_R = interpolate(exp_R, W.sub(0).collapse())
        src_I = interpolate(exp_I, W.sub(1).collapse())
        
        # Define damping and interpolate it
        exp_att = Attenuation(epsilon=epsilon, 
                            zlim=zlim, ylim=ylim,
                            degree=1)
        damping = interpolate(exp_att, P)
        # Variational forms (real and imaginary parts
        Ar_lhs = o_block(u_r,v_r,omegas[idx_i]) + \
                eps_block(u_i,v_r,omegas[idx_i],damping) + \
                A_block(u_r,v_r)
        Ai_lhs = o_block(u_i,v_i,omegas[idx_i]) - \
                eps_block(u_r,v_i,omegas[idx_i],damping) + \
                A_block(u_i,v_i)             

        A = assemble(Ar_lhs + Ai_lhs)
        # Apply source sequentially 
        for sous_j in range(nsous):   
            # Define function-solution
            u_sol = Function(W)
            #u_rsol = Function(W.sub(0).collapse())
            #u_isol = Function(W.sub(1).collapse())
            # Compute boundary layer
            bdry_id = int(21 + sous_j)
            b_rhs = b_block(src_R, v_r, bdry_id) + \
                    b_block(src_I, v_i, bdry_id)
            
            # Assemble of matrices
            b = assemble(b_rhs)
            # Apply boundary conditions
            [bc.apply(A,b) for bc in bcs]
            
            # Solve the variational problem
            solve(A, u_sol.vector(), b)
            # Assign real and imaginary parts
            (u_rsol, u_isol)  = u_sol.split(True)
            # Compute data at the sensors and save it as array
            for sens_k in range(nsens):
                # Obtain point value of solution u
                sensor_point = Point(np.array((zsens[sens_k], ysens[sens_k])))
                # Save data values at the sensor location
                solR_sensors_z[sens_k, idx_i, sous_j] = u_rsol(sensor_point)[0]
                solR_sensors_y[sens_k, idx_i, sous_j] = u_rsol(sensor_point)[1]
                solI_sensors_z[sens_k, idx_i, sous_j] = u_isol(sensor_point)[0]
                solI_sensors_y[sens_k, idx_i, sous_j] = u_isol(sensor_point)[1]
                
            if sous_j == 0:
                # Save vtk solution
                #vtk_u << (u_sol, float(freq_i))   
                # Print some info about the solutions
                print("Value at sensor: {0}, with freq: {1:.3f} [MHz]".format(
                    u_sol(sensor_point)[1], freq))
                #print("Value rhs", np.linalg.norm(b, ord=2))

    # create dictionary with variables to save
    savedic = {'zlim': zlim, 'ylim': ylim, 'nsous': nsous,
        'zsous': zsous, 'ysous': ysous, 'nsens': nsens,
        'zsens': zsens, 'ysens': ysens, 'nfreq': nfreq,
        'freqs': freqs, 'omegas': omegas,
        'solR_sensors_z': solR_sensors_z, 'solR_sensors_y': solR_sensors_y,
        'solI_sensors_z': solI_sensors_z, 'solI_sensors_y': solI_sensors_y}
    filename1 = 'src/features/simulations/services/Reidmen/Reidmen Fenics/ipnyb propagation/Files_mat/FreqSimp'+"POR"+str(por+1)+'TransIsoW'+ str(ylim)+'M'+str(size) + str(id) + '.mat'
    filename = 'FreqSimp'+"POR"+str(por+1)+'TransIsoW'+ str(ylim)+'M'+str(size) + str(id) + '.mat'
    sio.savemat(filename1, savedic, appendmat=True)

    print(filename1+"\n"+filename)
    ## Zona de Pruebas de tiempo ##
    Hora_final = datetime.now()
    print(Hora_final)
    tiempo_ejecucion = Hora_final - Hora_inicio
    #tiempo_ejecucion.strftime('%H:%M %p')
    print("Tiempo de ejecución",tiempo_ejecucion)

    #Save file into database
    return filename,tiempo_ejecucion