import React, { Component, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { logout } from '../../store/actions';
import { faSearch, faBookmark } from '@fortawesome/free-solid-svg-icons';
import './Header.scss';
import logo from '../../assets/images/logo.png';
import socketIOClient from 'socket.io-client';

import Recommandations from '../users/Recommantions/Recommandations';
import { rootUrl } from '../../configs/config';
import {autoSignIn} from '../../store/actions'

class Header extends Component {

    componentDidMount() {
        const socket = socketIOClient(rootUrl);
        socket.on('display notification', data => {
            const authData = JSON.parse(localStorage.getItem("authData"));
            if (authData&&authData.user) {
                if (authData.user._id === data.notification.to) {
                    this.props.onAutoSign();
                }
            }
        })
    }
    
    render() {
        const { name, token, role, accountValidated, user } = this.props;
        return (
            <nav  className={this.props.home ? "navbar navbar-expand-lg navbar-light bg-light": "navbar navbar-expand-lg navbar-light bg-light navbar-shadow" }>
                <div className="container">
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <form className="form-inline d-lg-none my-2 my-lg-0 navbar-brand form-mobile">
                        <input className="form-control mr-sm-2" type="search" placeholder="Rechercher..." aria-label="Rechercher..."/>
                        <FontAwesomeIcon icon={faSearch} size={"2x"} />
                    </form>
                    {
                        token ?
                        <div className="dropdown-mobile mt-2">
                            <a href="/recommandations" className=""  id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <FontAwesomeIcon icon={faBookmark} size={"1x"} /><sup className="ml-1">{user.recommandations && user.recommandations.length ? user.recommandations.length:0}</sup>
                            </a>
                                {user.recommandations && user.recommandations.length ? 
                                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                            <Recommandations recommandations={user.recommandations} />
                                    </div> : null
                                }
                        </div>:null
                            
                    }
                    <NavLink className="navbar-brand" to="/">
                        <img src={logo} width="110" height="100%" alt="Logo" />
                    </NavLink>
                    <div className="collapse navbar-collapse" id="navbarTogglerDemo03">
                        <form className="form-inline d-none d-lg-block my-2 my-lg-0 ml-auto mr-4 form-desktop">
                            <input className="form-control mr-sm-2" type="search" placeholder="Rechercher..." aria-label="Rechercher..."/>
                            <FontAwesomeIcon icon={faSearch} size={"2x"} />
                        </form>
                        <ul className="navbar-nav  mt-2 mt-lg-0">
                            {
                                token && role === "admin" ?
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/admin/home">Admin</NavLink>
                                </li>:null
                            }
                            {
                                token && role === "supplier" && accountValidated ?
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/dashboard/reservations">Réservations</NavLink>
                                </li>:null
                            }
                            {
                                token ?
                                <li className="nav-item rec-item-desktop">
                                    <div className="dropdown mt-2">
                                        <a href="/recommandations" className=""  id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <FontAwesomeIcon icon={faBookmark} size={"1x"} /><sup className="ml-1">{user.recommandations && user.recommandations.length ? user.recommandations.length : 0}</sup>
                                        </a>
                                        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                            {user.recommandations && user.recommandations.length ?
                                                <Recommandations recommandations={user.recommandations} /> : null
                                            }
                                        </div>
                                    </div>
                                </li>: null
                                    
                            }
                            {
                                !token ?
                                    <Fragment>
                                        <li className="nav-item">
                                            <NavLink className="nav-link" to="/auth/signup"><i className="fa fa-user"></i>Créer un compte</NavLink>
                                        </li>
                                        <li className="nav-item">
                                            <NavLink className="nav-link" to="/auth/login"><i className="fa fa-user"></i>Se connecter</NavLink>
                                        </li>
                                    </Fragment>
                                    :null
                            }
                        </ul>
                            {
                                token ?
                                <div className="dropdown">
                                    <p className="dropbtn">{name}</p>
                                    <div className="dropdown-content">
                                        <a href="#logout" onClick={this.props.onLogout}><i className="fa fa-sign-out"></i>Logout</a>
                                    </div>
                                </div>: null
                            }
                    </div>
                </div>
            </nav>
        );
    }
}

const mapStateToProps = state => {
    return {
        userId: state.auth.email,
        email: state.auth.email,
        name: state.auth.name,
        token: state.auth.token,
        role: state.auth.role,
        accountValidated: state.auth.accountValidated,
        user: state.auth.user
    }
}

const mapDispatchToState = dispatch => {
    return {
        onLogout: () => dispatch(logout()),
        onAutoSign: () => dispatch(autoSignIn())
    }
}


export default connect(mapStateToProps, mapDispatchToState)(Header);