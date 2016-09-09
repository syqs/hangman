import React from 'react';
//import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import Alphabet from './alphabet'
import CoolDown from './cooldown'
import keycode from 'keycode';

export default class Alphabets extends React.Component {

	constructor(props) {
		super(props);
		this.alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	}

	componentDidMount(){
		document.addEventListener('keyup', (e) => {
		  if(this.alphabets.indexOf(keycode(e).toUpperCase()) !== -1)
		  	this.props.serverAPI.makeGuess(keycode(e));
		})

	}

	render() {
		return ( 
			< div className = "alphabets"> 
				<CoolDown coolDown = {this.props.coolDown} totalCoolDown = {3000} />
				{
					this.alphabets.map((alphabet) => {
						var guessed = this.props.guessedLetters.includes(alphabet);
						return ( 
							<Alphabet alphabet={alphabet} guessed={guessed} serverAPI={this.props.serverAPI} />
							)
					})
				} 

			< /div>
		)
	}
}
