import React, { Component, Fragment } from 'react';
import './Filter.scss';
import Header from '../../globalComponent/Header';
import Categories from '../Categories/Categories';
import axios from 'axios';
import Services from '../Services/Services'
import Events from '../Events/Events'
import Loader from '../../globalComponent/Loader'

class FilterResults extends Component {

    state = {
        loading: true,
        services: [],
        events: [],
        error: ""
    }

    componentDidMount() {
        this.startFilter();
    }

    startFilter = () => {
        // const {category, town, date1, date2} = JSON.parse(localStorage.getItem("searchParams"));
        // Search for events
        this.setState({ loading: true })
        axios.post('/api/event/filter', JSON.parse(localStorage.getItem("searchParams")))
        .then(res => {
            this.setState({ loading: false, events: res.data.events, error: "" })
        })
        .catch(err => {
            this.setState({ loading: false, error: "Une érreur s'est produite. Veuillez reéssayer." })
        })
        // Search for services
        axios.post('/api/service/filter', JSON.parse(localStorage.getItem("searchParams")))
            .then(res => {
                this.setState({ loading: false, services: res.data.services, error: "" })
            })
            .catch(err => {
                this.setState({ loading: false, error: "Une érreur s'est produite. Veuillez reéssayer." })
            })
        // Clear localStorage
        localStorage.removeItem("searchParams")
    }

    componentDidUpdate(prevProps) {
        if(prevProps !== this.props) {
            // Verify if there is a query
            if(this.props.filter) {
                this.startFilter();
            }
        }
    }

    render() {
        return (
            <Fragment>
                <Header />
                <Categories />
                {this.state.loading ?   <div className="d-flex justify-content-center py-5"><Loader/></div>:
                <Fragment>
                    <Events eventType="Actualités" events={this.state.events} isFilterPage={true} />
                    <Services eventType="Services" services={this.state.services} isFilterPage={true} />  
                </Fragment>
                }
            </Fragment>
        )
    }
}

export default FilterResults;