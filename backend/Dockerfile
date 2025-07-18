FROM ubuntu:20.04

MAINTAINER FelipeCastro "felipe.castroa@alumnos.uv.cl"

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update -y && \
    apt-get install -y python3 python3-pip libmysqlclient-dev python3-dev

RUN apt-get install -y git
RUN pip install python-dotenv
RUN apt install make -y
RUN pip install cmake
RUN apt-get install -y libboost-container-dev
RUN apt-get install -y python3-dolfin
RUN apt-get install -y python3-mshr

#RUN apt install python3-dolfin-real
COPY ./requirements.txt /app/requirements.txt

# RUN git clone https://bitbucket.org/fenics-project/dolfin
# RUN git clone https://bitbucket.org/fenics-project/mshr
# RUN mkdir dolfin/build && cd dolfin/build && cmake .. && make install && cd ../..
# RUN mkdir mshr/build   && cd mshr/build   && cmake .. && make install && cd ../..
# RUN cd dolfin/python && pip3 install . && cd ../..
# RUN cd mshr/python   && pip3 install . && cd ../..

RUN python3 --version
RUN pip3 --version


WORKDIR /app
RUN pip install -r ./requirements.txt

#RUN FENICS_VERSION=$(python3 -c"import ffc; print(ffc.__version__)")

#RUN git clone https://bitbucket.org/fenics-project/dolfin
#RUN git clone https://bitbucket.org/fenics-project/mshr

#RUN mkdir dolfin/build && cd dolfin/build && cmake .. && make install && cd ../..
#RUN mkdir mshr/build   && cd mshr/build   && cmake .. && make install && cd ../..
#RUN cd dolfin/python && pip3 install . && cd ../..
#RUN cd mshr/python   && pip3 install . && cd ../..

#RUN mkdir dolfin/build && cd dolfin/build && cmake .. && make install && cd ../..
#RUN mkdir mshr/build   && cd mshr/build   && cmake .. && make install && cd ../..
#RUN cd dolfin/python && pip3 install . && cd ../..
#RUN cd mshr/python   && pip3 install . && cd ../..

COPY . /app

EXPOSE 5000

ENTRYPOINT [ "python3" ]

CMD [ "src/app.py" ]