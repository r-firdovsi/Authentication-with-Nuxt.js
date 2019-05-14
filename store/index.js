import Vuex from "vuex"
import Cookie from "js-cookie"
import axios from "axios"

const createStore = () => {
    return new Vuex.Store({
        state : {
            authKey : null
        },
        mutations : {
            setAuthKey(state, authKey) {
               state.authKey = authKey
            },
            clearAuthKey(state) {
                Cookie.remove("authKey")
                Cookie.remove("expiresIn")
                if(process.client) {
                    localStorage.removeItem("authKey")
                    localStorage.removeItem("expiresIn")
                }
                state.authKey = null
            }
        },
        actions : {
            nuxtServerInit(vuexContext, context) {

            },
            initAuth(vuexContext, req) {
                let token;
                let expiresIn;
                if(req) {
                    //Server uzerinde calisiyoruz
                    if(!req.headers.cookie) {
                       return;
                    }
                    //Cookie uzerinden token elde etmek
                    token = req.headers.cookie.split(";").find(c => c.trim().startsWith("authKey="))
                    if(token) {
                        token = token.split("=")[1]
                    }

                    expiresIn = req.headers.cookie.split(";").find(e => e.trim().startsWith("expiresIn="))
                    if(expiresIn) {
                        expiresIn = expiresIn.split("=")[1]
                    }

                } else {
                    //Client uzerinde calisiyoruz
                    token = localStorage.getItem("authKey")
                    expiresIn = localStorage.getItem("expiresIn")
                }
                if(new Date().getTime() > +expiresIn || !token) {
                    vuexContext.commit("clearAuthKey")
                }
                vuexContext.commit("setAuthKey", token)
            },
            authUser(vuexContext, authData) {

                let authLink = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key="

                if(authData.isUser) {
                    authLink = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key="
                }

                return  axios.post(authLink + process.env.firebaseAPIKEY, { email : authData.user.email, password : authData.user.password, returnSecureToken : true })
                    .then(response => {
                        let expiresIn =new Date().getTime() + +response.data.expiresIn * 1000;

                        Cookie.set("authKey", response.data.idToken)
                        Cookie.set("expiresIn", expiresIn)
                        localStorage.setItem("authKey", response.data.idToken)
                        localStorage.setItem("expiresIn", expiresIn)

                        vuexContext.commit("setAuthKey", response.data.idToken)
                    })
                    .catch()

            },
            logout(vuexContext) {
                vuexContext.commit("clearAuthKey")
            }
        },
        getters : {
            isAuthenticated(state) {
                return state.authKey != null
            },
            getAuthKey(state) {
                return state.authKey
            }
        }
    })
}

export default createStore