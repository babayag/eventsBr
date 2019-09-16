import React from 'react';
import {rootUrl} from '../../../configs/config';

const ServiceItem = (props) => {
    const offre = props.service.offre.length <= 90 ? props.service.offre:
        props.service.offre.slice(0, 88) + '...';
    return (
        <a href={"/annonce/service/"+props.service._id} className="mt-5">
            <div className="card">
                <div className="box">
                    <div className="img">
                        <img src={rootUrl+'/'+props.service.image} alt="Service" />
                    </div>
                    <h2>{props.service.category}<br/>
                    <span>{props.service.title}</span></h2>
                    <p>{offre}</p>
                </div>
            </div>
        </a>
    );
}

export default ServiceItem;