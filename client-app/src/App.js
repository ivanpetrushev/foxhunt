import React from 'react';
import './App.css';
import {Button, Container, Row, Col, Modal} from "react-bootstrap";
// import L from 'leaflet';
import {Circle, Map, Marker, Popup, ScaleControl, TileLayer} from 'react-leaflet'
// import {FaBars} from "react-icons/fa";
import {distance, getRandomLocation} from "./helpers";
import {gis} from "./gis";

class App extends React.Component {
    state = {
        playerLat: null,
        playerLon: null,
        targetLat: null,
        targetLon: null,
        targetBearing: null,
        targetSpeed: null,
        circles: [],
        showWin: false,
        showNewGame: false,
        zoom: 13
    };

    componentDidMount() {
        let me = this;

        // force HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }

        navigator.geolocation.getCurrentPosition(function (position) {
            me.setState({playerLat: position.coords.latitude, playerLon: position.coords.longitude});
        });
        navigator.geolocation.watchPosition(function (position) {
            me.setState({playerLat: position.coords.latitude, playerLon: position.coords.longitude});
        });

        let targetLat = localStorage.getItem('targetLat');
        let targetLon = localStorage.getItem('targetLon');
        if (targetLat) {
            this.setState({
                targetLat: targetLat,
                targetLon: targetLon,
            })
        }
    }

    onZoomend = (e) => {
        this.setState({zoom: e.target.getZoom()});
    };

    onNewGame = () => {
        let pos = getRandomLocation(this.state.playerLat, this.state.playerLon, 500);
        this.setState({
            showWin: false,
            showNewGame: true,
            circles: [],
            targetLat: pos.latitude,
            targetLon: pos.longitude,
            targetBearing: Math.random() * 360, // degrees
            targetSpeed: Math.random() * 2 // km/h
        })
    };

    onRadar = () => {
        let circles = this.state.circles;
        let now = new Date().getTime() / 1000;
        let secondsSinceLast = null;
        let targetLat = this.state.targetLat;
        let targetLon = this.state.targetLon;

        if (circles.length) {
            secondsSinceLast = now - circles[circles.length - 1].ts;
            let distanceMeters = this.state.targetSpeed * secondsSinceLast / 3600 * 1000;
            let newCoord = gis.createCoord([targetLon, targetLat], this.state.targetBearing, distanceMeters);
            targetLon = newCoord[0];
            targetLat = newCoord[1];
        }

        let dist = distance(this.state.playerLat, this.state.playerLon, targetLat, targetLon, 'K') * 1000;
        console.log('dist', dist)
        if (dist < 25) {
            this.setState({showWin: true});
            localStorage.removeItem('targetLat');
            localStorage.removeItem('targetLon');
            return;
        }

        circles.push({
            lat: this.state.playerLat,
            lon: this.state.playerLon,
            radius: dist,
            ts: now
        });
        this.setState({
            circles: circles,
            targetLat: targetLat,
            targetLon: targetLon,
        });
        localStorage.setItem('targetLat', targetLat);
        localStorage.setItem('targetLon', targetLon);
    };

    render() {
        let position = [0, 0];
        if (this.state.playerLon) {
            position = [this.state.playerLat, this.state.playerLon];
        }

        // icons: https://github.com/pointhi/leaflet-color-markers
        // let targetIcon = new L.Icon({
        //     iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        //     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        //     iconSize: [25, 41],
        //     iconAnchor: [12, 41],
        //     popupAnchor: [1, -34],
        //     shadowSize: [41, 41]
        // });

        return (
            <Container>
                <Modal show={this.state.showWin} onHide={() => {
                    this.setState({showWin: false})
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>You won!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        You caught the fox!
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={this.onNewGame}>New Game</Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={this.state.showNewGame} onHide={() => {
                    this.setState({showNewGame: false})
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>New Game</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>There is a fox somewhere around you. Find it using your radar. Get within 25 meters to catch
                            it.</p>
                        <p>The fox will not stay in one place, so be sure to ping it often to detect its movement.</p>
                        <p>Always be aware of your surroundings. Hunt safe!</p>
                        <p>No location data will be stored on our end.</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => {
                            this.setState({showNewGame: false})
                        }}>Go!</Button>
                    </Modal.Footer>
                </Modal>

                <Row>
                    <Map center={position} zoom={this.state.zoom} onZoomend={this.onZoomend}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                        />
                        <Marker position={position}>
                            <Popup>A pretty CSS3 popup.<br/>Easily customizable.</Popup>
                        </Marker>
                        {/*{this.state.targetLat &&*/}
                        {/*    <Marker icon={targetIcon} position={[this.state.targetLat, this.state.targetLon]}>*/}
                        {/*        <Popup>Target</Popup>*/}
                        {/*    </Marker>*/}
                        {/*}*/}
                        {this.state.circles.map((item, idx) => {
                            let opacityFactor = this.state.circles.length - idx - 1;
                            let opacity = 1 - opacityFactor * 0.2;
                            return <Circle key={idx}
                                           center={[item.lat, item.lon]}
                                           radius={item.radius}
                                           opacity={opacity}
                                           fill={false}
                            />
                        })}
                        <ScaleControl/>
                    </Map>
                </Row>
                <Row>
                    <Col xs={9}>
                        <Button className="btn-fullscreen" variant="primary" onClick={this.onRadar}
                                disabled={!this.state.targetLat}>
                            Fire Radar
                        </Button>
                    </Col>
                    <Col>
                        <Button className="btn-almost-fullscreen" variant="outline-dark" onClick={this.onNewGame}>
                            <img src="/fox-icon.png" width={32} alt="New Game"/>
                        </Button>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default App;
