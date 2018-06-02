pipeline {
  agent {
    docker {
      image 'node:10.3.0-stretch'
    }
    
  }
  stages {
    stage('') {
      steps {
        sh 'npm run build'
      }
    }
  }
}