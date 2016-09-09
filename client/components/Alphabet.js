import React from 'react';


export default class Alphabet extends React.Component {

	constructor(props) {
		super(props);
	}

	isActive(){
		return 'alphabet '+ ((this.props.guessed) ? 'alphabet-guessed':'alphabet-active');
	}

	onAlphabetClick(e){
		if(!this.props.guessed){
			this.props.serverAPI.makeGuess(this.props.alphabet);
		}
	}

	render() {
		return ( 
			< div className = {this.isActive()} onClick = {(e)=>{this.onAlphabetClick(e)}}> 
				{ this.props.alphabet} 
			< /div>
		)
	}
}