// Trans MODULE
module.exports = {
	pushTrans: function(transPath, trans) {
		return fbRef.child('/trans/'+transPath).push(trans, function(error) {
			if (error) {
				//todo notify via email or wsp of push error
				//save to file
				console.error(error)
				fs.writeFileSync(path.resolve(__dirname, './../trans/'+transPath)+Date.now() + ".json", JSON.stringify(trans));
			}
		})
	}
}
