// AWS PUT/GET WRAPPERS
var AWS = require('aws-sdk');
const credentials = {accessKeyId: env.AWSAPIS3_ACCESS_KEY, secretAccessKey: env.AWSAPIS3_SECRES_KEY}
AWS.config.update(credentials);
AWS.config.logger = 'console';
var s3 = new AWS.S3({region: 'us-east-1', maxRetries: 3});
var s3Bucket = 'nexxit-api';

module.exports = {
	getObject: function(key, cb) {
		console.log (new Date(), "AWS Getting "+key);
		var params = {
		  Bucket: s3Bucket,
		  Key: key
		};

		s3.getObject(params, function(err, data) {
			if (err) {
				  console.log (new Date(), "AWS GET Object Error");
				  if (cb) { cb({ status: "err", msg: err.message }); }
			} else {
				  //~ AcceptRanges: 'bytes',
				  //~ LastModified: 2019-02-09T03:08:10.000Z,
				  //~ ContentLength: 8887398,
				  //~ ETag: '"350fc6c98473d1d67bd942d593773f4a"',
				  //~ CacheControl: 'no-cache, no-store, must-revalidate',
				  //~ ContentType: 'image/jpeg',
				  //~ Metadata: {},
				  //~ Body:
				 if (cb) { cb({ status: "ok", file: data }); }
			}
		});
	},

	putObject: function(key, content, contentType, cb) {
		var params = {
			Bucket: s3Bucket,
			Key: key,
			Body: content,
			ACL:"private",
			CacheControl: "no-cache, no-store, must-revalidate",
			StorageClass: "STANDARD",
			ContentType: contentType
		};

		s3.putObject(params).send(function(err, data) {
			if (!err) {
				if (cb) { cb({ status: "ok", msg: 'AWS Put Object Success' }); }
			} else {
				console.log (new Date(), "AWS PUT Object Error");
				console.log (err);
				if (cb) { cb({ status: "err", msg: err.message }); }

			}
		});
	}



}
