// JOBS MODULE
module.exports = {
	pushJob: function(jobPath, job) {
		return firebase.database().ref('/jobs/').push(job, function(error) {
			if (error) {
				//todo notify via email or wsp of push error
				//save to file
				console.error(error)
				fs.writeFileSync(path.resolve(__dirname, './../jobs/')+"/"+Date.now() + ".json", JSON.stringify(job));
			}
		})
	}
}
