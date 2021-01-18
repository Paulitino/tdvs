const sqlite3 = require('sqlite3');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db/database.db');

db.run(`
CREATE TABLE IF NOT EXISTS accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING,
    password STRING,
    birthday DATE,
    city STRING
    )
    `)

db.run(`
CREATE TABLE IF NOT EXISTS trainings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING,
    description STRING,
    start DATE,
    stop DATE
    )
    `)

db.run(`
CREATE TABLE IF NOT EXISTS weights(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username STRING,
    weight INTEGER,
    time DATE
    )
    `)

module.exports = {
    loginRequest: function(userName, done) {
        const query = "SELECT password From accounts WHERE username = ?"
        const values = [userName]

        db.all(query, values, function(error, password) {
            if (error) {
                return done("error")
            } else {
                return done(password)
            }
        })
    },

    subscribeRequest: function(username, hashpw, birthday, city, done) {
        const query = "INSERT INTO accounts (username, password, birthday, city) VALUES (?, ?, ?, ?)"
        const values = [username, hashpw, birthday, city]

        db.run(query, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        })
    },

    getTrainingsByUsername: function(user, done) {
        const query2 = "SELECT * FROM trainings WHERE username=?"
        const value2 = [user]

        db.all(query2, value2, function(error, trainings) {
            if (error) {
                return done("error")
            } else {
                return done(trainings)
            }
        })
    },

    getWeightsByUsername: function(user, done) {
        const query2 = "SELECT * FROM weights WHERE username=?"
        const value2 = [user]

        db.all(query2, value2, function(error, weights) {
            if (error) {
                return done("error")
            } else {
                return done(weights)
            }
        })
    },

    getAccountByUsername: function(user, done) {
        const query = "SELECT * FROM accounts WHERE username=?"
        const value = [user]

        db.all(query, value, function(error, accounts) {
            if (error) {
                return done("error")
            } else {
                return done(accounts)
            }
        })
    },

    updateUserByUsername: function(username, birthday, city, oldUsername, done) {
        const query2 = "UPDATE accounts SET username=?, birthday=?, city=? WHERE username=?"
        const value2 = [username, birthday, city, oldUsername]

        db.all(query2, value2, function(error) {
            if (error) {
                 return done("error")
            } else {
                return done()
            }
        })
    },

    updatePasswordByUsername: function(username, password, done) {
        const query2 = "UPDATE accounts SET password=? WHERE username=?"
        const values = [password, username]

        db.all(query2, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        });
    },

    getAllAccounts: function(done) {
        const query="SELECT * FROM accounts"

        db.all(query, function(error, accounts) {
            if (error) {
                return done("error")
            } else {
                return done(accounts)
            }
        })
    },

    newTrainingRequest: function(username, description, start, stop, done) {
        const query = "INSERT INTO trainings (username, description, start, stop) VALUES (?, ?, ?, ?)"
        const values = [username, description, start, stop]
    
        db.run(query, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        })
    },

    getTrainingById: function(id, done) {
        const query2 = "SELECT * FROM trainings WHERE id=?"
        const value2 = [id]

        db.all(query2, value2, function(error, trainings) {
            if (error) {
                return done("error")
            } else {
                return done(trainings)
            }
        })
    },

    updateTrainingByUsername: function(username, oldUsername, done) {
        const query2 = "UPDATE trainings SET username=? WHERE username=?"
        const value2 = [username, oldUsername]

        db.all(query2, value2, function(error) {
            if (error) {
                 return done("error")
            } else {
                return done()
            }
        })
    },

    updateTrainingById: function(id, description, start, stop, done) {
        const query2 = "UPDATE trainings SET description=?, start=?, stop=? WHERE id=?"
        const value2 = [description, start, stop, id]

        db.all(query2, value2, function(error) {
            if (error) {
                 return done("error")
            } else {
                return done()
            }
        })
    },

    deleteTraining: function(id, done) {
        const query = "DELETE FROM trainings WHERE id = ?"
        const values = [id]
    
        db.run(query, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        })
    },

    newWeightRequest: function(username, date, weight, done) {
        const query = "INSERT INTO weights (username, weight, time) VALUES (?, ?, ?)"
        const values = [username, weight, date]

        db.run(query, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        });
    },

    getWeightById: function(id, done) {
        const query2 = "SELECT * FROM weights WHERE id=?"
        const value2 = [id]

        db.all(query2, value2, function(error, weights) {
            if (error) {
                return done("error")
            } else {
                return done(weights)
            }
        })
    },

    updateWeightByUsername: function(username, oldUsername, done) {
        const query2 = "UPDATE weights SET username=? WHERE username=?"
        const value2 = [username, oldUsername]

        db.all(query2, value2, function(error) {
            if (error) {
                 return done("error")
            } else {
                return done()
            }
        })
    },

    updateWeightById: function(id, weight, time, done) {
        const query2 = "UPDATE weights SET weight=?, time=? WHERE id=?"
        const value2 = [weight, time, id]

        db.all(query2, value2, function(error) {
            if (error) {
                 return done("error")
            } else {
                return done()
            }
        })
    },

    deleteWeight: function(id, done) {
        const query = "DELETE FROM weights WHERE id = ?"
        const values = [id]
    
        db.run(query, values, function(error) {
            if (error) {
                return done("error")
            } else {
                return done()
            }
        })
    },

    // REST API

    getAllAccountsApi: function(request, response) {
        const query="SELECT * FROM accounts"

        db.all(query, function(error, accounts) {
            if (error) {
                response.status(400).send({error: "error"})
            } else {
                response.status(200).send({accounts: accounts})
            }
        })
    },

    deleteAccountByUsernameApi: function(request, response) {
        const query="DELETE FROM accounts WHERE username = ?"
        const values=request.user;

        db.all(query, values, function(error) {
            if (error) {
                response.status(400).send({error: "error"})
            } else {
                response.status(200).send()
            }
        })
    },

    newAccountApi: function(request, response) {
        const query = "INSERT INTO accounts (username, password, birthday, city) VALUES (?, ?, ?, ?)"
        const values = [request.body.username, request.body.password, request.body.birthday, request.body.city]

        if (!request.body.username || !request.body.password || !request.body.birthday || !request.body.city ) {
            response.status(400).send({error: "all fields are required !!!"})

        } else {
            db.run(query, values, function(error) {
                if (error) {
                    response.status(400).send({error: error})
                } else {
                    response.status(200).send()
                }
            })
        }
    },

    newTrainingRequestApi: function(request, response) {
        const query = "INSERT INTO trainings (username, description, start, stop) VALUES (?, ?, ?, ?)"
        const values = [request.body.username, request.body.description, request.body.start, request.body.stop]

        if (!request.body.username || !request.body.description || !request.body.start || !request.body.stop ) {
            response.status(400).send({error: "all fields are required !!!"})

        } else if (!request.headers.authorization) {
            response.status(401).send()
        } else {
            let to = request.headers.authorization
            const token = to.slice(7)

            jwt.verify(token, "chocapic", function(error, auth) {
                if (error) {

                    response.status(401).send({error: error})
                } else if (request.body.username != auth.user[0].username) {

                    response.status(401).send({error: "You can't modify other's people data"})
                } else {
                    const query2 = "SELECT * FROM accounts WHERE username = ?"
                    const values2 = [request.body.username]

                    db.all(query2, values2, function(err, acc) {
                        if (err) {
                            response.status(400).send({error: error})
                        } else if (acc == "") {
                            response.status(400).send({error: 'user does not exist'})
                        } else{
                            db.run(query, values, function(error) {
                                if (error) {
                                    response.status(400).send({error: error})
                                } else {
                                    response.status(204).send()
                                }
                            })
                        }
                    })
                }
            })
        }
    },

    newWeightRequestApi: function(request, response) {
        const query = "INSERT INTO weights (username, weight, time) VALUES (?, ?, ?)"
        const values = [request.body.username, request.body.weight, request.body.time]

        if (!request.body.username || !request.body.weight || !request.body.time) {
            response.status(400).send({error: "all fields are required !!!"})

        } else if (!request.headers.authorization) {

            response.status(401).send()
        } else {
            let to = request.headers.authorization
            const token = to.slice(7)

            jwt.verify(token, "chocapic", function(error, auth) {
                if (error) {
                    response.status(401).send({error: error})
                }  else if (request.body.username != auth.user[0].username) {

                    response.status(401).send({error: "You can't modify other's people data"})
                } else {
                    const query2 = "SELECT * FROM accounts WHERE username = ?"
                    const values2 = [request.body.username]

                    db.all(query2, values2, function(err, acc) {
                        if (err) {
                            response.status(400).send({error: error})
                        } else if (acc == "") {
                            response.status(400).send({error: 'user does not exist'})
                        } else {
                            db.run(query, values, function(error) {
                                if (error) {
                                    response.status(400).send({error: error})
                                } else {
                                    response.status(204).send()
                                }
                            })
                        }
                    })
                }
            })
        }
    },

    loginApi: function(request, response) {
        const query = "SELECT password From accounts WHERE username = ?"
        const values = [request.body.username]
        const askPassword = request.body.password

        if (!request.body.username || !askPassword) {

            response.status(400).send({error: "all fields are required !!!"})

        } else {
            db.all(query, values, function(error, password) {
                if (error) {

                    response.status(400).send({error: error})
                } else if(password == "") {

                    response.status(400).send({error: "invalid_grant"})
                } else {
                    bcrypt.compare(askPassword, password[0].password, function(error, res) {
                        if (error) {

                            response.status(400).send({error: error})
                        } else {
                            if (res == false) {

                                response.status(400).send({error: "invalid_grant"})
                            } else if(res == true) {
                                const query = "SELECT * FROM accounts WHERE username = ?"
                                const values = [request.body.username]

                                db.all(query, values, function(error, user) {
                                    if (error) {
                                        response.status(400).send({error: error})    
                                    } else {
                                        const jot = jwt.sign({user}, "chocapic", {expiresIn: '24h'})
                                        const idToken = jwt.sign({sub: user[0].id, preferred_username: user[0].username}, "chocapic", {expiresIn: '24h'})
        
                                        response.status(200).send({accessToken: jot, token_type: "bearer", id_token: idToken})
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }
    },
}