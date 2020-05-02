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
        player_lat: null,
        player_lon: null,
        target_lat: null,
        target_lon: null,
        target_bearing: null,
        target_speed: null,
        circles: [],
        show_win: false,
        show_new_game: false,
        zoom: 13
    };

    componentDidMount() {
        let me = this;

        // force HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }

        navigator.geolocation.getCurrentPosition(function (position) {
            me.setState({player_lat: position.coords.latitude, player_lon: position.coords.longitude});
        });
        navigator.geolocation.watchPosition(function (position) {
            me.setState({player_lat: position.coords.latitude, player_lon: position.coords.longitude});
        });

        let targetLat = localStorage.getItem('targetLat');
        let targetLon = localStorage.getItem('targetLon');
        if (targetLat) {
            this.setState({
                target_lat: targetLat,
                target_lon: targetLon,
            })
        }
    }

    onZoomend = (e) => {
        this.setState({zoom: e.target.getZoom()});
    };

    onNewGame = () => {
        let pos = getRandomLocation(this.state.player_lat, this.state.player_lon, 500);
        this.setState({
            show_win: false,
            show_new_game: true,
            circles: [],
            target_lat: pos.latitude,
            target_lon: pos.longitude,
            target_bearing: Math.random() * 360, // degrees
            target_speed: Math.random() * 2 // km/h
        })
    };

    onRadar = () => {
        let circles = this.state.circles;
        let now = new Date().getTime() / 1000;
        let secondsSinceLast = null;
        let targetLat = this.state.target_lat;
        let targetLon = this.state.target_lon;

        if (circles.length) {
            secondsSinceLast = now - circles[circles.length - 1].ts;
            let distanceMeters = this.state.target_speed * secondsSinceLast / 3600 * 1000;
            let newCoord = gis.createCoord([targetLon, targetLat], this.state.target_bearing, distanceMeters);
            targetLon = newCoord[0];
            targetLat = newCoord[1];
        }

        let dist = distance(this.state.player_lat, this.state.player_lon, targetLat, targetLon, 'K') * 1000;
        console.log('dist', dist)
        if (dist < 25) {
            this.setState({show_win: true});
            localStorage.removeItem('targetLat');
            localStorage.removeItem('targetLon');
            return;
        }

        circles.push({
            lat: this.state.player_lat,
            lon: this.state.player_lon,
            radius: dist,
            ts: now
        });
        this.setState({
            circles: circles,
            target_lat: targetLat,
            target_lon: targetLon,
        });
        localStorage.setItem('targetLat', targetLat);
        localStorage.setItem('targetLon', targetLon);
    };

    render() {
        let position = [0, 0];
        if (this.state.player_lon) {
            position = [this.state.player_lat, this.state.player_lon];
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
                <Modal show={this.state.show_win} onHide={() => {
                    this.setState({show_win: false})
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

                <Modal show={this.state.show_new_game} onHide={() => {
                    this.setState({show_new_game: false})
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
                            this.setState({show_new_game: false})
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
                        {/*{this.state.target_lat &&*/}
                        {/*    <Marker icon={targetIcon} position={[this.state.target_lat, this.state.target_lon]}>*/}
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
                                disabled={!this.state.target_lat}>
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
