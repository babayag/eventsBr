import React, { Component, Fragment } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import socketIOClient from "socket.io-client";
import {connect} from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faMapMarked, faSearch, faComment, faAnchor } from '@fortawesome/free-solid-svg-icons';
import './DetailsPage.scss';
import {DateFormat} from "../../utils/DateFormat"
// import AwesomeSlider from 'react-awesome-slider';
// import AwsSliderStyles from 'react-awesome-slider/src/styles';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import ImageGallery from 'react-image-gallery';
import "react-image-gallery/styles/scss/image-gallery.scss";

import Header from '../../globalComponent/Header';
import Hoc from '../../globalComponent/Hoc';
import ReviewItem from '../Reviews/ReviewItem';
import SearchResultItem from '../UserSearchResult/UserSearchResult';
import Stars from '../Stars/Stars';
import Loader from '../../globalComponent/Loader';
import {rootUrl} from '../../../configs/config';
import logo from '../../../assets/images/logo.png';
import {counponToPrint} from '../CouponSchema/Coupon'
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const image2base64 = require('image-to-base64');


class DetailsPage extends Component {
    state = {
        showReservationModal: false,
        showRecModal: false,
        showCouponModal: false,
        showVideo: false,
        showToast: false,
        downloadingCoupon: false,
        coupon: '',

        announce: null,
        loading: true,
        error: '',
        /* When leaving a comment */
        userMessage: '',
        userEmail: this.props.user ? this.props.user.email : '',
        userName: this.props.user ? this.props.user.name : '',
        sendingComment: false,
        messageValid: false,
        commentError: '',

        /* When making a reservation */
        tel: '',
        numberOfPlaces: '',
        name: this.props.user ? this.props.user.name : '',
        email: this.props.user ? this.props.user.email : '',
        formValid: false,
        reserving: false,
        reservationError: '',

        /* when searching user */
        searchingUser: false,
        userList: [],
        search: '',
        /* when making recommandations */
        recError: '',
    }

    handleInputChange = (e) => {
        e.preventDefault();
        const name = e.target.name;
        const value = e.target.value;
        this.setState({
            [name]: value
        }, this.validate);
    }

    validate = () => {
        const { name, email, tel, numberOfPlaces, userEmail, userName, userMessage } = this.state;
        this.setState({ 
            formValid: name.trim().length > 0 && 
                email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i) 
                && tel.trim().length > 0 && numberOfPlaces.trim().length > 0,
            messageValid: userName.trim().length > 0 && 
                userEmail.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i) &&
                userMessage.trim().length > 0
         })
    }

    searchUser = (e) => {
        e.preventDefault();
        const name = e.target.name;
        const value = e.target.value;
        this.setState({
            [name]: value,
            searchingUser: true
        });
        if(value.length > 1) {
            axios.get('/api/user/' + value + '/search')
            .then(res => {
                const userList = res.data.users
                this.setState({ searchingUser: false, userList: userList })
            })
            .catch(err => {
                this.setState({ searchingUser: false})
            })
        }
    }

    openRecommandationModal = () => {
        if(this.props.user) {
            this.setState({showRecModal: true})
        } else {
            this.props.history.push('/auth/login');
        }
    }

    // Make a reccommandation
    makeRecommadation = (id) => {
        const rec = {
            to: id, 
            title: this.state.announce.title, 
            link: '/annonce/' + this.props.match.params.anounceType + '/' + this.props.match.params.id,
            image: rootUrl +'/'+ this.state.announce.image,
            name: this.props.user.name,
            visited: false,
            projectId: this.props.match.params.id,
            date: new Date() 
        }
        try {
            // Send notification with socketio
            const socket = socketIOClient(rootUrl);
            // save in database
            axios.patch('/api/user/'+id+'/recommand', { rec: rec })
            .then(res => {
                    socket.emit("new notification", rec);
                    this.setState({ recError: '' })
                })
                .catch(err => {
                    this.setState({ recError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
                })
        } catch (error) {
            this.setState({ recError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
        }
    }

    // When make a reservation
    makeReservation = (e) => {
        e.preventDefault();
        this.setState({reserving: true})
        const { anounceType, id } = this.props.match.params;
        let url = "";
        if(anounceType === "event") {
            url = "/api/event/" + id + "/makereservation";
        } else 
        if (anounceType === "service"){
            url = "/api/service/" + id + "/makereservation";
        }
        try {
            const reservation = {
                userId: this.props.user._id,
                name: this.state.name,
                email: this.state.email,
                tel: this.state.tel,
                numberOfPlaces: this.state.numberOfPlaces,
                image: rootUrl + '/' + this.state.announce.image,
                title: this.state.announce.title,
                link: '/annonce/' + this.props.match.params.anounceType + '/' + this.props.match.params.id,
                projectId: this.props.match.params.id,
                date: new Date()
            }
            axios.patch(url, { reservation: reservation })
            .then(res => {
                this.setState({ reserving: false, reservationError: '', showReservationModal: false })
            })
            .catch(err => {
                this.setState({ reserving: false, reservationError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
            })
        } catch (error) {
            this.setState({ reserving: false, reservationError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
        }
    }

    openReservationModal = () => {
        if(this.props.user) {
            this.setState({showReservationModal: true})
        } else {
            this.props.history.push('/auth/login');
        }
    }

    componentDidUpdate(prevProps) {
        if(prevProps.user !== this.props.user) {
            this.setState({ 
                name: this.props.user.name, 
                email: this.props.user.email, 
                userEmail: this.props.user.email, 
                userName: this.props.user.name})
        }
    }

    componentDidMount() {
        const {anounceType, id} = this.props.match.params;
        let url = "";
        if(anounceType === "event") {
            url = '/api/event/' + id;
        } else if(anounceType === "service") {
            url = '/api/service/' + id;
        }
        // get data from event/service
        try {
            axios.get(url)
            .then(res => {
                let data = anounceType === "event" ? res.data.event: res.data.service;
                this.setState({announce: data, loading: false, error: ''})
                // The way to update visited notification
                const authData = JSON.parse(localStorage.getItem("authData"));
                if (authData&&authData.user.recommandations) {
                    let notifications = [...authData.user.recommandations];
                    authData.user.recommandations.forEach((not, i) => {
                        if (not.projectId === this.props.match.params.id && !not.visited) {
                            let updateOne = {...not};
                            updateOne.visited = true;
                            notifications[i] = updateOne;
                            axios.patch('/api/user/' + authData.user._id + '/notification/seen', { rec: notifications})
                            .then(res => {
                                this.setState({ recError: '' })
                            })
                            .catch(err => {
                                this.setState({ recError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
                            })
                        }
                    });
                }
            })
            .catch(err => {
                this.setState({loading: false, error: 'Une érreur s\'est produite. Veuillez recharger la page.'})
            })
        } catch (error) {
            this.setState({ loading: false, error: 'Une érreur s\'est produite. Veuillez recharger la page.' })
        }

    }

    submitComment = (e) => {
        e.preventDefault();
        this.setState({ sendingComment: true })
        const { anounceType, id } = this.props.match.params;
        let url = "";
        if (anounceType === "event") {
            url = "/api/event/" + id + "/comment";
        } else
            if (anounceType === "service") {
                url = "/api/service/" + id + "/comment";
            }
        try {
            const comment = {
                name: this.state.userName,
                email: this.state.userEmail,
                message: this.state.userMessage,
                date: new Date()
            }
            axios.patch(url, { comment: comment })
            .then(res => {
                let newAnnounce = {...this.state.announce};
                newAnnounce.comments.push(comment);
                this.setState({ sendingComment: false, commentError: '', userEmail: '', userName: '', userMessage: '', announce: newAnnounce })
            })
            .catch(err => {
                this.setState({ sendingComment: false, commentError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
            })
        } catch (error) {
            this.setState({ sendingComment: false, commentError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
        }
    }

    getCoupon = () => {
        if(this.props.user) {
            if (this.state.announce.coupons && this.state.announce.coupons.clients) {
                // Verify if i have not already download the this coupons
                if (this.state.announce.coupons.clients.includes(this.props.user._id)) {
                    alert("Vous avez déja télécharger le coupon.");
                } else {
                    this.setState({downloadingCoupon: true})
                    // update the the remainings coupons
                    let url = rootUrl + '/api/' + this.props.match.params.anounceType + '/' + this.state.announce._id + '/add/coupon';
                    let coupon = { ...this.state.announce.coupons};
                    coupon.nCoupons = Number(coupon.nCoupons) - 1;
                    coupon.clients.push(this.props.user._id);
                    axios.patch(url, { coupon: coupon })
                    .then(res => {
                        let newAnnounce = {...this.state.announce}
                        newAnnounce.coupons.clients.push(this.props.user._id)
                        // Generate the pdf
                        image2base64(logo) // you can also to use url
                            .then(response => {
                                const {infos, montant, datelimite} = this.state.announce.coupons;
                                let docDefinition = counponToPrint(response, infos, montant, datelimite, 
                                    this.state.announce.title, window.location.href, this.state.announce.title.split(' ').join('-'))
                                const pdfDocGenerator = pdfMake.createPdf(docDefinition).open();
                                this.setState({ downloadingCoupon: false, announce: newAnnounce, showCouponModal: false });
                                pdfDocGenerator.getDataUrl((dataUrl) => {
                                    const iframe = document.createElement('iframe');
                                    iframe.src = dataUrl;
                                    // document.getElementById("couponpreview").appendChild(iframe);
                                });
                            })
                            .catch((error) => console.log(error))
                    })
                    .catch(err => {
                        this.setState({ loading: false, couponError: 'Une erreur s\'est produite. Veuillez reéssayer.' });
                    })
                }
            }
        } else {
            this.props.history.push('/auth/login');
        }
    }

    displayToast = () => {
        this.setState({showToast: true});
        navigator.clipboard.writeText('http://entrecops.co/annonce/' + this.props.match.params.anounceType + '/' + this.props.match.params.id,);
        setTimeout(() => {
            this.setState({showToast: false});
        }, 2000)
    }

    setFile(name,file, previewFile) {
        this.setState({
            [name]: file
        });
    }

    render() {
        const { announce, error, loading, name, email, tel, messageValid, reserving, downloadingCoupon,
                numberOfPlaces, formValid, reservationError, recError, sendingComment, userEmail, userName, userMessage } = this.state;
        const {anounceType} = this.props.match.params;

        let images = [];
        if(announce&&announce.images) {
            images = announce.images.map(image => {
                return {
                    original: rootUrl + '/' + image,
                    thumbnail: rootUrl + '/' + image
                }
            })
        }

        return (
            <Hoc>
                <Header />
                <section className="project-details">
                    <div className="container" id="projectdetails">
                        <div className="row">
                            {error.length ? <div className="alert alert-danger d-block mr-auto ml-auto">{error}</div>:null}
                        </div>
                        <div className="row pb-5 pt-3">
                            {
                                loading ? <div className="d-block mr-auto ml-auto py-5 mt-5"><Loader /></div>:
                                <Fragment>
                                    <div className="col-sm-12 col-md-8 col-lg-8 left">
                                        <div className="infos pb-4">
                                            {/* <img src={rootUrl + '/' +announce.image} alt="service" /> */}
                                            {/* <AwesomeSlider bullets={false} cssModule={AwsSliderStyles}>
                                                {announce.images.map((image, id) => <div key={id} data-src={rootUrl + '/' + image} />)}
                                            </AwesomeSlider> */}

                                            <ImageGallery items={images} />

                                            <div className="otherinfos">
                                                <div className="d-flex align-items-center justify-content-between titleandstars">
                                                    <div>
                                                        <h2>{announce.title}</h2>
                                                        <h5 className="py-2">{announce.category}</h5>
                                                    </div>
                                                    <div className="moreinfos d-none d-md-block d-flex justify-content-between mt-3">
                                                        <Stars 
                                                            rate={announce.rate ? announce.rate: null }
                                                            anounceType={anounceType}  
                                                            id={this.props.match.params.id} />
                                                    </div>
                                                </div>
                                                <hr/>
                                            </div>

                                            {/* Mobile Version */}
                                            <div className="right right-mobile" id="right-mobile">
                                                <div className="infos">
                                                {
                                                    anounceType === "event" ?
                                                    <Fragment>
                                                        <div className="d-flex py-2">
                                                            <FontAwesomeIcon icon={faCalendar} size={"2x"} />
                                                            <h2>Date: <DateFormat date={announce.date} /></h2>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex py-2">
                                                            <FontAwesomeIcon icon={faMapMarked} size={"2x"} />
                                                            <h2>Lieu: {announce.place}</h2>
                                                        </div>
                                                    </Fragment>:null
                                                }
                                                {
                                                    anounceType === "service" ?
                                                    <Fragment>
                                                        <div className="d-flex py-2">
                                                            <FontAwesomeIcon icon={faCalendar} size={"2x"} />
                                                            <h2>Durée: {announce.duration}</h2>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex py-2">
                                                            <FontAwesomeIcon icon={faMapMarked} size={"2x"} />
                                                            <h2>Lieu: {announce.place}</h2>
                                                        </div>
                                                        <hr />
                                                        <div className="d-flex py-2">
                                                            <FontAwesomeIcon icon={faAnchor} size={"2x"} />
                                                            <h2>Cible: {announce.target}</h2>
                                                        </div>
                                                    </Fragment>:null
                                                }
                                                    <hr />
                                                    <button className="button mt-3 book" 
                                                        onClick={this.openReservationModal}>Reserver</button>
                                                    <button className="button mt-3 reccommand" 
                                                        onClick={this.openRecommandationModal}>Recommander</button>
                                                </div>

                                                <div className="other-infos mt-4">
                                                    {announce.coupons ?
                                                        Number(announce.coupons.nCoupons) > 0 ?
                                                            <div className="d-flex flex-column py-2">
                                                                <h3 className="pb-3">Coupon  disponible !!</h3>
                                                                <h3 style={{ color: "#DC3545" }}>{announce.coupons.infos}</h3><br />
                                                                <h4>Coupon de réduction de <strong>{announce.coupons.montant}</strong>.</h4><br />
                                                                <button className="button mt-2 book" onClick={this.getCoupon}>Télécharger le Coupon {downloadingCoupon ? <Loader color="white" /> : null}</button>
                                                            </div> :
                                                            <div className="d-flex flex-column py-2">
                                                                <h3>Pas de Coupons de réductions disponible pour cette annonce.</h3>
                                                            </div> :
                                                        <div className="d-flex flex-column py-2">
                                                            <h3>Pas de Coupons de réductions disponible pour cette annonce.</h3>
                                                        </div>
                                                    }
                                                </div>
                                                <div className="moreinfos d-flex justify-content-between mb-3">
                                                    <div className="headers d-flex align-items-center py-4">
                                                        <FontAwesomeIcon icon={faComment} size={"2x"} />
                                                        <h3 className="ml-3 mb-0">Reviews des clients</h3>
                                                    </div>
                                                    <Stars 
                                                        rate={announce.rate ? announce.rate: null }
                                                        anounceType={anounceType}  
                                                        id={this.props.match.params.id} />
                                                </div>
                                                <div className="other-infos mt-4">
                                                    <div className="d-flex flex-column">
                                                        {
                                                            announce.video&&announce.video.length ?
                                                            <Fragment>
                                                                <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                                                <video src={rootUrl + '/' + announce.video} width="100%" height="100%" controls onClick={() => this.setState({ showVideo: true })}>
                                                                </video>
                                                            </Fragment> :
                                                                    announce.youtubeVideoLink&&announce.youtubeVideoLink.length ?
                                                                <Fragment>
                                                                    <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                                                    <iframe width="100%" height="100%" title="Video de l'annonce"
                                                                        src={announce.youtubeVideoLink}
                                                                        onClick={() => this.setState({ showVideo: true })}>
                                                                    </iframe>
                                                                </Fragment> :
                                                                <h3 className="mb-3 text-center">Aucune vidéo disponible.</h3>
                                                        }
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <div className="mt-4">
                                                            <iframe title="Location"
                                                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.8047750987917!2d11.497123550867022!3d3.852039097184224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcfbe61c08cd3%3A0x355870322ba0a3ce!2sCentre%20r%C3%A9gional%20africain%20d&#39;administration%20du%20travail!5e0!3m2!1sfr!2scm!4v1570633011922!5m2!1sfr!2scm" width="100%" height="250px" frameborder="0" style={{ border: "0" }} allowfullscreen=""></iframe>
                                                        </div>
                                                        <h3 className="mb-3 mt-5">A propos du promoteur</h3>
                                                        <div className="d-flex justify-content-between align-items-center owner">
                                                            <div>
                                                                <p>Nom: {announce.owner.name}</p>
                                                                <p>Tel: {announce.owner.tel}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* End Mobile Version */}

                                            {
                                                anounceType === "event" ?
                                                <Fragment>
                                                    <div className="otherinfos">
                                                        <div className="d-flex flex-column">
                                                            <h3>Description</h3>
                                                            <p>{announce.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="otherinfos">
                                                        <div className="d-flex flex-column">
                                                            <h3>Autres Informations</h3>
                                                            <p>{announce.otherInfos}</p>
                                                        </div>
                                                        <hr/>
                                                    </div>
                                                </Fragment>:null
                                            }
                                            {
                                                anounceType === "service" ?
                                                <Fragment>
                                                    <div className="otherinfos">
                                                        <div className="d-flex flex-column">
                                                            <h3>Offre</h3>
                                                            <p>{announce.offre}</p>
                                                        </div>
                                                    </div>
                                                    <div className="otherinfos">
                                                        <div className="d-flex flex-column">
                                                            <h3>Problème</h3>
                                                            <p>{announce.problem}</p>
                                                        </div>
                                                        <hr/>
                                                    </div>
                                                </Fragment>:null
                                            }

                                            <div className="moreinfos d-flex justify-content-between mb-3">
                                                <div className="headers d-flex align-items-center py-4">
                                                    <FontAwesomeIcon icon={faComment} size={"2x"} />
                                                    <h3 className="ml-3 mb-0">Reviews des clients</h3>
                                                </div>
                                            </div>
                                            <div className="moreinfos">
                                                <div className="content">
                                                    {
                                                        announce.comments&&announce.comments.length ?
                                                        announce.comments.reverse().map((comment, i) => (
                                                            <ReviewItem key={i} comment={comment} />
                                                        ))
                                                        : <h5 className="text-center py-3">Aucun commentaire</h5>
                                                    }
                                                </div>
                                            </div>
                                            <div className="form-content mb-5">
                                                <p>Laissez un commentaire</p>
                                                <form className="input__form">
                                                    <div className="row">
                                                        <div className="col-sm-6">
                                                            <div className="form-group">
                                                                    <input placeholder="Votre nom" value={userName} className="form-control" name="userName" onChange={(e) => this.handleInputChange(e)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="form-group">
                                                                    <input placeholder="Adresse email" value={userEmail} className="form-control" name="userEmail" onChange={(e) => this.handleInputChange(e)} />
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-12 my-2">
                                                            <div className="form-group">
                                                                    <textarea placeholder="Entrer votre commentaire" value={userMessage} name="userMessage" className="form-control" onChange={(e) => this.handleInputChange(e)} id="textmessage" rows="3"></textarea>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button disabled={sendingComment || !messageValid} onClick={(e) => this.submitComment(e)} className="btn btn-danger send-btn" type="submit">Publier {sendingComment ? <Loader color="white"/>:null}</button>
                                                </form>
                                            </div>
                                        </div>
                                    
                                    </div>

                                    <div className="col-sm-12 col-md-4 col-lg-4 right right-desktop">
                                        <div className="">
                                            <div className="infos">
                                            {
                                                anounceType === "event" ?
                                                <Fragment>
                                                    <div className="d-flex py-2">
                                                        <FontAwesomeIcon icon={faCalendar} size={"2x"} />
                                                        <h2>Date: <DateFormat date={announce.date} /></h2>
                                                    </div>
                                                    <hr />
                                                    <div className="d-flex py-2">
                                                        <FontAwesomeIcon icon={faMapMarked} size={"2x"} />
                                                        <h2>Lieu: {announce.place}</h2>
                                                    </div>
                                                </Fragment>:null
                                            }
                                            {
                                                anounceType === "service" ?
                                                <Fragment>
                                                    <div className="d-flex py-2">
                                                        <FontAwesomeIcon icon={faCalendar} size={"2x"} />
                                                        <h2>Durée: {announce.duration}</h2>
                                                    </div>
                                                    <hr />
                                                    <div className="d-flex py-2">
                                                        <FontAwesomeIcon icon={faMapMarked} size={"2x"} />
                                                        <h2>Lieu: {announce.place}</h2>
                                                    </div>
                                                    <hr />
                                                    <div className="d-flex py-2">
                                                        <FontAwesomeIcon icon={faAnchor} size={"2x"} />
                                                        <h2>Cible: {announce.target}</h2>
                                                    </div>
                                                </Fragment>:null
                                            }
                                                <hr />
                                                <button className="button mt-3 book" 
                                                    onClick={() => this.openReservationModal()}>Reserver</button>
                                                <button className="button mt-3 reccommand" 
                                                    onClick={() => this.openRecommandationModal()}>Recommander</button>
                                            </div>

                                            <div className="other-infos mt-4">
                                                {announce.coupons ?
                                                    Number(announce.coupons.nCoupons) > 0 ?
                                                    <div className="d-flex flex-column py-2">
                                                        <h3 className="pb-3">Coupon  disponible !!</h3>
                                                        <h3 style={{ color: "#DC3545"}}>{announce.coupons.infos}</h3><br/>
                                                        <h4>Coupon de réduction de <strong>{announce.coupons.montant}</strong>.</h4><br/>
                                                            <button className="button mt-2 book" onClick={this.getCoupon}>Télécharger le Coupon {downloadingCoupon ? <Loader color="white" /> : null}</button>
                                                    </div>:
                                                    <div className="d-flex flex-column py-2">
                                                        <h3>Pas de Coupons de réductions disponible pour cette annonce.</h3>
                                                    </div>:
                                                    <div className="d-flex flex-column py-2">
                                                        <h3>Pas de Coupons de réductions disponible pour cette annonce.</h3>
                                                    </div>
                                                }
                                            </div>
                                            <div className="other-infos mt-4">
                                                <div className="d-flex flex-column">
                                                        {
                                                            announce.video&&announce.video.length ?
                                                                <Fragment>
                                                                    <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                                                    <video src={rootUrl + '/' + announce.video} width="100%" height="100%" controls onClick={() => this.setState({ showVideo: true })}>
                                                                    </video>
                                                                </Fragment> :
                                                                announce.youtubeVideoLink&&announce.youtubeVideoLink.length ?
                                                                    <Fragment>
                                                                        <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                                                        <iframe width="100%" height="100%" title="Video de l'annonce"
                                                                            src={announce.youtubeVideoLink}
                                                                            onClick={() => this.setState({ showVideo: true })}>
                                                                        </iframe>
                                                                    </Fragment> :
                                                                <h3 className="mb-3 text-center">Aucune vidéo disponible.</h3>
                                                        }
                                                </div>
                                            </div>
                                            <div className="other-infos mt-4">
                                                <div className="d-flex flex-column">
                                                        <h3 className="mb-4">Localisation</h3>
                                                    <div>
                                                        <iframe title="Location" 
                                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.8047750987917!2d11.497123550867022!3d3.852039097184224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcfbe61c08cd3%3A0x355870322ba0a3ce!2sCentre%20r%C3%A9gional%20africain%20d&#39;administration%20du%20travail!5e0!3m2!1sfr!2scm!4v1570633011922!5m2!1sfr!2scm" width="100%" height="250px" frameborder="0" style={{border:"0"}} allowfullscreen=""></iframe>
                                                    </div>
                                                    <h3 className="mb-3 mt-5">A propos du promoteur</h3>
                                                    <div className="d-flex justify-content-between align-items-center owner">
                                                        <div>
                                                            <p>Nom: {announce.owner.name}</p>
                                                            <p>Tel: {announce.owner.tel}</p>
                                                        </div>
                                                        <img src={rootUrl+'/'+announce.owner.profileImage} alt="profileimage" width="100" height="100" className="rounded-circle align-self-center" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </Fragment>
                            }
                        </div>
                    </div>
                </section>

                {/* Reservation */}
                <Modal show={this.state.showReservationModal} onHide={() => this.setState({showReservationModal: !this.state.showReservationModal})} >
                    <Modal.Header closeButton>
                    <Modal.Title>Faites votre réservation</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="container">
                            <div className="row">
                                <div className="col-sm-12 pl-4 pr-4 mt-4 mb-3">
                                    {!formValid ? <div className="alert alert-danger">Veuillez remplir tous les champs</div>:null}
                                    {reservationError.length ? <div className="alert alert-danger">{reservationError}</div>:null}
                                    <div className="form-group">
                                        <label for="name">Nom complet</label>
                                        <input type="text" className="form-control" onChange={(e) => this.handleInputChange(e)} value={name} name="name" id="name" placeholder="Nom complet"/>
                                    </div>
                                    <div className="form-group">
                                        <label for="email">Email address</label>
                                        <input type="email" className="form-control" onChange={(e) => this.handleInputChange(e)} value={email} name="email" id="email" placeholder="Adresse Email"/>
                                    </div>
                                    <div className="form-group">
                                        <label for="tel">Numero de Téléphone (Whatsapp)</label>
                                        <input type="tel" className="form-control" value={tel} onChange={(e) => this.handleInputChange(e)} name="tel" id="tel" pattern="[0-9]{9}" placeholder="Numero Whatsapp"/>
                                    </div>
                                    <div className="form-group">
                                        <label for="places">Nombre de places</label>
                                        <input type="number" className="form-control" value={numberOfPlaces} onChange={(e) => this.handleInputChange(e)} name="numberOfPlaces" id="places" placeholder="Nombre de places"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="py-3">
                            <Button variant="danger" disabled={!formValid || reserving} onClick={(e) => this.makeReservation(e) }>
                                Valider la Reservation {reserving ? <Loader color="white" />: null}
                            </Button>
                            <Button variant="default" onClick={() => this.setState({showReservationModal: !this.state.showReservationModal})}>
                                Fermer
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>

                {/* Recommandation */}
                <Modal show={this.state.showRecModal} onHide={() => this.setState({showRecModal: !this.state.showRecModal})} size="lg" >
                    <Modal.Header closeButton>
                    <Modal.Title>Faire des recommandations</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="container">
                            <div className="row">
                                <div className="col-sm-12 pl-4 pr-4 mt-4 mb-3">
                                    {recError.length ? <div className="alert alert-danger">{recError}</div>:null}
                                    <div className="d-flex flex-row search align-items-center">
                                        <input type="text" className="form-control searchInput" value={this.state.search} onChange={(e) => this.searchUser(e)} name="search" placeholder="Rechercher un membre"/>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </div>
                                    {/* Results */}
                                    {
                                        this.state.searchingUser ? <div className="d-block mr-auto ml-auto text-center mt-3"><Loader/></div>:
                                            this.state.userList.length ?
                                            <div className="results py-5">
                                                {
                                                    this.state.userList.map((user, i) => {
                                                        const item = user.recommandations.filter(ev => (
                                                            ev.title === announce.title
                                                        ))
                                                        if (item.length) {
                                                            return <SearchResultItem key={i} recommanded={true} makeRecommandation={() => this.makeRecommadation(user._id)} name={user.name} email={user.email} />
                                                        } else {
                                                            return <SearchResultItem key={i} recommanded={false} makeRecommandation={() => this.makeRecommadation(user._id)} name={user.name} email={user.email} />
                                                        }
                                                    })
                                                }
                                            </div>:<h5 className="text-center d-block mr-auto ml-auto mt-3">Aucun utilisateur trouvé.</h5>
                                    }
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        {this.state.showToast ? <h4 className="mr-3">Lien de partage Copié !!!</h4> : null}
                        {/* <Button variant="outline-dark" onClick={this.displayToast}>
                            Copier le lien de partage
                        </Button> */}
                        <Button variant="default" onClick={() => this.setState({showRecModal: !this.state.showRecModal})}>
                            Fermer
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Coupon */}
                {/* <Modal show={this.state.showCouponModal} onHide={() => this.setState({showCouponModal: false})} size="md" >
                    <Modal.Header closeButton>
                    <Modal.Title>Coupon de réduction</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="container">
                            <div className="row justify-content-between">
                                <div className="col-sm-12 pl-4 pr-4 mt-4 mb-3 text-center">
                                    <Fragment>
                                        {
                                            this.state.announce&&this.state.announce.coupons ?
                                            <Fragment>
                                                <div className="d-flex justify-content-center" id="couponpreview">
                                                    <button 
                                                        className="btn btn-danger btn-lg mb-2 mt-3" 
                                                        onClick={this.getCoupon}>Télécharger le coupon {downloadingCoupon ? <Loader color="white" /> : null}</button>
                                                </div>
                                            </Fragment>
                                            :null
                                        }
                                    </Fragment>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="py-3">
                            <Button variant="default" onClick={() => this.setState({showCouponModal: false})}>
                                Fermer
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal> */}

                {/* Video */}
                <Modal show={this.state.showVideo} onHide={() => this.setState({showVideo: false})} size="lg" >
                    <Modal.Header closeButton>
                    <Modal.Title>Video</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {
                            this.state.announce && this.state.announce.video && this.state.announce.video.length ?
                                <Fragment>
                                    <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                    <video src={rootUrl + '/' + this.state.announce.video} width="100%" height="100%" controls onClick={() => this.setState({ showVideo: true })}>
                                    </video>
                                </Fragment> :
                                this.state.announce && this.state.announce.youtubeVideoLink && this.state.announce.youtubeVideoLink.length ?
                                    <Fragment>
                                        <h3 className="mb-3">Regardez l'aperçu en video</h3>
                                        <iframe width="100%" height="100%" title="Video de l'annonce"
                                            src={this.state.announce.youtubeVideoLink}
                                            onClick={() => this.setState({ showVideo: true })}>
                                        </iframe>
                                    </Fragment> :
                                    <h3 className="mb-3 text-center">Aucune vidéo disponible.</h3>
                        }
                    </Modal.Body>
                </Modal>
            </Hoc>
        );
    }
}

const mapPropsToState = state => {
    return {
        user: state.auth.user
    }
}

export default connect(mapPropsToState)(DetailsPage);