pipeline {
  agent {
    docker {
      image 'node:10.3.0-stretch'
    }
    
  }
  stages {
    stage('Install Packages') {
      steps {
        sh 'npm install'
      }
    }
    stage('Build Project') {
      steps {
        sh 'npm run build'
      }
    }
    stage('Build Docker Image') {
      steps {
        sh 'docker build ./ -t firestarthehack/mtgbackend:latest'
      }
    }
  }
}