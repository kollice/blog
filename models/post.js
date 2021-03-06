/**
 * Created by kollice on 2015/2/23.
 */
var mongodb = require('./db');
var markdown = require('markdown').markdown;
function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        data: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "_" + (date.getMonth() + 1),
        day: date.getFullYear() + "_" + (date.getMonth() + 1) + "_" + date.getDate(),
        minute: date.getFullYear() + "_" + (date.getMonth() + 1) + "_" + date.getDate() + date.getHours() + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    var post = {
        name: this.name,
        title: this.title,
        time: time,
        post: this.post
    };
    mongodb.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            db.collection('posts', function (err, collection) {
                if (err) {
                    close();
                    return callback(err);
                }
                collection.insert(post, {
                    safe: true
                }, function (err) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        }
    );
};

Post.getAll = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null, docs);
            });
        });
    });
};

Post.getOne = function(name,day,title,callback) {
    mongodb.open(function(err,db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts',function(err,collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                doc.post = markdown.toHTML(doc.post);
                callback(null,doc);
            })
        })
    })
}

module.exports = Post;