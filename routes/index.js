var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    Post.getAll(null,function(err,posts) {
        if (err) {
            posts = []
        }
        res.render('index', {
            title: '主页',posts:posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    })
});

router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res, next) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res, next) {
    var name = req.body.name;
    var password = req.body.password;
    var password_re = req.body['password-repeat'];
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致');
        return res.redirect('/reg');
    }
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email: req.body.email
    });
    User.get(newUser.name, function (err, user) {
        if (user) {
            req.flash('error', '用户已存在');
            return res.redirect('/reg');
        }
        newUser.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            req.session.user = user;
            req.flash('success', '注册成功');
            res.redirect('/');
        });
    });
});
router.get('/login', checkNotLogin);
router.get('/login', function (req, res, next) {
    res.render('login', {
        title: '登录', user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/login', checkNotLogin);
router.post('/login', function (req, res, next) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在');
            return res.redirect('/login');
        }
        if (user.password != password) {
            req.flash('error', '密码错误');
            return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success', '登录成功');
        return res.redirect('/');
    })

});
router.get('/post', checkLogin);
router.get('/post', function (req, res, next) {
    res.render('post', {title: '发表',user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()});
});
router.post('/post', checkLogin);
router.post('/post', function (req, res, next) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name,req.body.title,req.body.post);
    post.save(function(err){
        if (err) {
            req.flash('error',err);
            return res.redirect('/')
        }
        req.flash('success','发布成功！');
        res.redirect('/');
    });
});
router.get('/logout', checkLogin);
router.get('/logout', function (req, res, next) {
    req.session.user = null;
    req.flash('success', '登出成功');
    return res.redirect('/');
});

router.get('/upload',checkLogin);
router.get('/upload',function(req,res,next){
    res.render('upload',{
        title:'文件上传',
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
    });
});

router.post('/upload',checkLogin);
router.post('/upload',function(req,res,next){
    for (var i in req.files) {
        if (req.files[i].size === 0) {
            fs.unlinkSync(req.files[i].path);
            console.log('成功删除一个空文件。');
        } else {
            var target_path = './public/uploads/' + req.files[i].name;
            fs.renameSync(req.files[i].path,target_path);
            console.log('成功重命名一个文件');
        }
    }
    req.flash('success','文件上传成功');
    res.redirect('/upload');
});

router.get('/u/:name', function (req,res,next) {
    User.get(req.params.name,function(err,user) {
        if (!user) {
            req.flash('error','用户不存在');
            return res.redirect('/');
        }
        Post.getAll(user.name,function(err,posts) {
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('user',{
                title:user.name,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:day/:title',function(req,res,next){
    Post.getOne(req.params.name,req.params.day,req.params.title, function (err, post) {
        if (err) {
            req.flash('error',err);
            res.redirect('/');
        }
        res.render('article',{
            title:req.params.title,
            post:post,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
})

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error','未登录！');
        return res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error','已登录！');
        return res.redirect('back');
    }
    next();
}

module.exports = router;

