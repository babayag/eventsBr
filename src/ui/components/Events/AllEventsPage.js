import React, { Component } from 'react';
import Hoc from '../../globalComponent/Hoc';
import Header from '../../globalComponent/Header';
import Events from './Events';
import Categories from '../Categories/Categories';
import Footer from '../../globalComponent/Footer';

class AllEventsPage extends Component {

    render() {
        return (
            <Hoc>
                <Header />
                <Categories />
                <Events eventType="Tous les Evènements" isHomePage={false} />
                <Footer />
            </Hoc>
        );
    }
}

export default AllEventsPage;