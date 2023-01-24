// Trans MODULE
module.exports = {
	pushEvidence: function(evidencePath, evidence) {
		//console.log(`evidence: ${JSON.stringify(evidence, null, 2)}`)
		return fbRef.child('/evidences/'+evidencePath).push(evidence, function(error) {
			if (error) {
				//todo notify via email or wsp of push error
				//save to file
				console.error(error)
				fs.writeFileSync(path.resolve(__dirname, './../evidences/'+evidencePath)+"/"+Date.now() + ".json", JSON.stringify(evidence));
			}
		})
	}
}
