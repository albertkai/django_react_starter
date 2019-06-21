import React from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import fetch from 'isomorphic-fetch';

import './style.scss';
import reactLogo from './images/react-logo.png';
import reduxLogo from './images/redux-logo.png';
import { SERVER_URL } from '../../utils/config';
import { checkHttpStatus, parseJSON } from '../../utils';

class HomeView extends React.Component {
    static propTypes = {
        statusText: PropTypes.string,
        userName: PropTypes.string,
        dispatch: PropTypes.func.isRequired
    };

    static defaultProps = {
        statusText: '',
        userName: ''
    };

    state = {
        topic: '',
        startDate: '',
        endDate: '',
        loading: false,
        tweets: [],
        errorOccured: false
    };

    componentDidMount() {
        this.setState({
           tweets: [
               { user: 'Al g fg', text: 'Youasdf asldfj ksdg ksdfhg ksldfhg lksdhfg kdhlsfg dfgh dfgh kdflgk df;lghk ;', label: 'Positive', sentiment_raw: 0.21435234 },
               { user: 'Al', text: 'Youasdf asldfj ksdg ksdfhg ksldfhg lksdhfg kdhlsfg', label: 'Positive', sentiment_raw: 0.21435234 },
               { user: 'Al', text: 'Youasdf asldfj ksdg ksdfhg ksldfhg lksdhfg kdhlsfg', label: 'Positive', sentiment_raw: 0.21435234 },
               { user: 'Al', text: 'Youasdf asldfj ksdg ksdfhg ksldfhg lksdhfg kdhlsfg', label: 'Positive', sentiment_raw: 0.21435234 },
               { user: 'Al', text: 'Youasdf asldfj ksdg ksdfhg ksldfhg lksdhfg kdhlsfg', label: 'Positive', sentiment_raw: 0.21435234 }
           ],
            positive: 43,
            negative: 10,
            neutral: 59
        });
    }

    onChange(e) {
       this.setState({ [e.target.name]: e.target.value });
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({ loading: true });
        fetch(`${SERVER_URL}/api/v1/accounts/sentiment/?topic=${this.state.topic}&startDate=${this.state.startDate}&endDate=${this.state.endDate}`, {
            method: 'get',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        })
            .then(checkHttpStatus)
            .then(parseJSON)
            .then(({ processed, positive, negative, neutral }) => {
                this.setState({
                    loading: false,
                    tweets: processed,
                    positive,
                    negative,
                    neutral,
                    errorOccured: false
                });
            })
            .catch((error) => {
                this.setState({
                    loading: false,
                    errorOccured: true
                });
            });
    };

    renderResults = () => {
        const { loading, topic, errorOccured, positive, negative, neutral, tweets } = this.state;
        if (loading) {
            return (
                <p>Analyzing <strong>{topic}</strong>...</p>
            );
        }
        if (!tweets.length) return <p>Oops, nothing found</p>;
        if (errorOccured) return <p>Oops, error occured:(</p>;
        const total = positive + negative + neutral;
        const positivePercentage = Math.round(positive / total * 100);
        const negativePercentage = Math.round(negative / total * 100);
        const neutralPercentage = Math.round(100 - positive - negative);
        return (
           <div>
                <h2>Results for {this.state.topic}</h2>
               <div className="graph-sentiment">
                   <div style={{ height: `${positivePercentage}%` }} />
                   <div style={{ height: `${neutralPercentage}%` }} />
                   <div style={{ height: `${negativePercentage}%` }} />
               </div>
               <h3>100 recent tweets</h3>
               <div class="table-responsive">
                   <table className="table table-striped">
                       <thead>
                           <tr>
                               <th scope="col">User</th>
                               <th scope="col">Text</th>
                               <th scope="col">Sentiment</th>
                               <th scope="col">Sentiment score</th>
                           </tr>
                       </thead>
                       <tbody>
                            {this.state.tweets.map(tweet => (
                                <tr>
                                    <td>@{tweet.user}</td>
                                    <td>{tweet.text}</td>
                                    <td>{tweet.label}</td>
                                    <td>{tweet.sentiment_raw}</td>
                                </tr>
                            ))}
                       </tbody>
                   </table>
               </div>
           </div>
        );
    };
    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <form autoComplete="off" className="form" role="form" onSubmit={this.onSubmit.bind(this)}>
                            <div className="form-group row">
                                <label className="col-lg-3 col-form-label form-control-label">Topic</label>
                                <div className="col-lg-9">
                                    <input className="form-control" type="text" name="topic" onChange={this.onChange.bind(this)} value={this.state.topic} />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label className="col-lg-3 col-form-label form-control-label">Start date</label>
                                <div className="col-lg-9">
                                    <input className="form-control" type="date" name="startDate" onChange={this.onChange.bind(this)} value={this.state.startDate} />
                                </div>
                            </div>
                            <div className="form-group row">
                                <label className="col-lg-3 col-form-label form-control-label">End date</label>
                                <div className="col-lg-9">
                                    <input className="form-control" type="date" name="endDate" onChange={this.onChange.bind(this)} value={this.state.endDate} />
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col-lg-9">
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        disabled={this.state.loading}
                                    >
                                        {this.state.loading ? 'Analyzing...' : 'Analyze'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-6">
                        {this.renderResults()}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        userName: state.auth.userName,
        statusText: state.auth.statusText
    };
};

export default connect(mapStateToProps)(HomeView);
export { HomeView as HomeViewNotConnected };
