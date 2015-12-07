var express = require('express');
var router = express.Router();
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' });
var fs = require('fs');
var AWS = require('aws-sdk'); 
var _config = require('../config/config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/upload', function(req, res, next){
   
   res.render('upload', {title : 'Upload image'}); 
});

router.post('/upload', upload.single('product'), function(req, res, next){
   console.log('/// ----------- Upload');
   console.log(req.file);
   console.log(appRoot + '/uploads');
   if(!req.file) {
      return res.render('upload', {title : 'Upload Image', message : { type: 'danger', messages : [ 'Failed uploading image. 1x001']}});
   } else {
      fs.rename(req.file.path, appRoot + '/uploads/' + req.file.originalname, function(err){
         if(err){
            return res.render('upload', {title : 'Upload Image', message : { type: 'danger', messages : [ 'Failed uploading image. 1x001']}});
         } else {
            //pipe to s3
            AWS.config.update({accessKeyId: _config.aws_access_key_id, secretAccessKey: _config.aws_secret_access_key});
            var fileBuffer = fs.readFileSync(appRoot + '/uploads/' + req.file.originalname);
            console.log(fileBuffer);
            var s3 = new AWS.S3();
            var s3_param = {
               Bucket: 'poshbellies',
               Key: req.file.originalname,
               Expires: 60,
               ContentType: req.file.mimetype,
               ACL: 'public-read',
               Body: fileBuffer
            };
            s3.putObject(s3_param, function(err, data){
               if(err){
                  console.log(err);
               } else {
                var return_data = {
                   signed_request: data,
                   url: 'https://poshbellies.s3.amazonaws.com/'+req.file.originalname
                   
                }; 
                console.log('return data - ////////// --------------');
                console.log(return_data);
                 return res.render('upload', {data : return_data, title : 'Upload Image : success', message : { type: 'success', messages : [ 'Uploaded Image']}});
                
               }
            });
            
           
         }
      })
   }
});

module.exports = router;
