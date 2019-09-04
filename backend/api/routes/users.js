const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/user');

// Create a user
router.post('/signup', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (user) {
                return res.status(409).json({
                    message: 'EMAIL_EXIST',
                    status: 409
                })
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        })
                    } else {
                        const user = new User({
                            _id: mongoose.Types.ObjectId(),
                            name: req.body.name,
                            email: req.body.email,
                            password: hash
                        });
                        user.save()
                            .then(user => {
                                const token = jwt.sign({
                                    email: user.email,
                                    username: user.username,
                                    userId: user._id
                                }, "ENTRECOPS_SECRET.JWT_KEY",
                                {
                                    expiresIn: "24h"
                                });
                                res.status(201).json({
                                    message: 'User Created',
                                    token: token,
                                    user: user
                                })
                            }).catch(err => {
                                console.log(err)
                                res.status(500).json({ error: err })
                            })
                    }
                })
            }
        })
})

// User Login
router.post('/login', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .exec()
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    message: 'EMAIL_NOT_EXIST'
                })
            }
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: 'Auth Fail'
                    })
                }
                if (result) {
                    const token = jwt.sign({
                        email: user.email,
                        username: user.username,
                        userId: user._id
                    }, "ENTRECOPS_SECRET.JWT_KEY",
                    {
                        expiresIn: "24h"
                    });
                    return res.status(200).json({
                        message: 'Auth Successfull',
                        token: token,
                        user: user
                    })
                }
                res.status(401).json({
                    message: 'Auth Fail, Password'
                })
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        })
})

// delete a user
router.delete('/:userId', (req, res, next) => {
    User.remove({ _id: req.params.userId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "User deleted"
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({ error: err })
        })
})

module.exports = router;