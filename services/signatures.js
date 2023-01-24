const { PythonShell } = require('python-shell')

module.exports = {
  match: (source, target) => {
    return new Promise((resolve, reject) => {
      try {
        let options = {
          mode: 'text',
          pythonOptions: ['-u'], // get print results in real-time
          scriptPath: path.resolve(__dirname), //If you are having python_test.py script in same folder, then it's optional.
          args: [tools.stringSingleImage(source), tools.stringSingleImage(target)] //An argument which can be accessed in the script using sys.argv[1]
        }

        PythonShell.run('signature.py', options, function (err, result) {
          if (err){
            reject(err)
          } else {
            // result is an array consisting of messages collected
            //during execution of script.
            console.log('result: ', result)
            resolve(result)
          }
        })

      } catch (error) {
        reject(error)
      }
    })
  }
}
