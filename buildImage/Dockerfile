FROM jenkinsci/ssh-slave
USER root
RUN apt update -y
RUN apt install sudo -y
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo apt-get install -y nodejs
USER jenkins