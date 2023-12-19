import React, {Component, useState} from 'react';
import "bootstrap/dist/css/bootstrap.css";


class Home extends Component {

    render(){

        return (
            <div style={{ backgroundColor: '#242526', height: "95vh"}}>
               <div className="row m-auto g-5" style={{width: "80vw" }}>
                    <div className="col-3 p-4" style={{ backgroundColor: '#3F4041'}}>
                        <h1 className='text-white fw-bold'>Welcome</h1>
                    </div>
                    <div className="col-9 text-white">
                        <div className="p-4" style={{ backgroundColor: '#3F4041'}}>
                            <div className='row'>
                                <div className='col-11'>
                                    <h3>Live Chat</h3>
                                    <p>Real-time chatting with anyone</p>
                                </div>
                            </div>
                            
                        </div>
                        <div className="p-4 mt-3" style={{ backgroundColor: '#3F4041'}}>
                            <div className='row'>
                                <div className='col-11'>
                                    <h3>Video Call</h3>
                                    <p>Converse like never before</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
        );
    }
}

export default Home;