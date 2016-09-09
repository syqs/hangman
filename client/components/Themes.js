import React from 'react';
//import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export default class Themes extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			background: props.background,
			anamation: {
				bubble: [], // adds all the bubbles 
				snow: [], // adds the snow
			},
		} 
	}
	componentWillReceiveProps(){
		this.setState({background: document.getElementsByClassName("dropMenu")[0].value}) //to update the background to know if snow/bubbles are needed
	}
	componentDidMount(){
		var that = this;// so can use this inside function 
		function drawEffect(){
					//canvas init
					
					var canvas = document.getElementById("snowy");
					var ctx = canvas.getContext("2d");
					
					//canvas dimensions
					var W = window.innerWidth;
					var H = window.innerHeight;
					canvas.width = W;
					canvas.height = H-50;
					
					//snowflake this.state.anamation.snow
					
					for(var i = 0; i < 500; i++)	{
						that.state.anamation.snow.push({
							x: Math.random()*W, //x-coordinate
							y: Math.random()*H, //y-coordinate
							r: Math.random()*4+1, //radius
							d: Math.random()* 500 //density
						})
					}
					for(var i = 0; i < 20; i++)	{
						that.state.anamation.bubble.push({
							x: Math.random()*W, //x-coordinate
							y: Math.random()*H, //y-coordinate
							r: Math.random()*50+1, //radius
							d: Math.random()*20 //density
						})
					}
					
					//Lets draw the flakes
					function draw()	{
						ctx.clearRect(0, 0, W, H);
						W = window.innerWidth;
						H = window.innerHeight;
						canvas.width = W;
						canvas.height = H-50;	
						// craeting snow/bubbles
						ctx.beginPath(); 
						if(that.state.background == "snowy"){
							ctx.fillStyle = "rgba(255, 255, 255, .9)"; //snow dematnions 
							for(var i = 0; i < 500; i++)	{
								var p = that.state.anamation.snow[i];
								ctx.moveTo(p.x, p.y);
								ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
							}
						}
						if(that.state.background == "sea"){
							ctx.fillStyle = "rgba(200, 190, 255, .5)"; // bubbles dumantions 
							for(var i =0; i<  20; i++){
								var p = that.state.anamation.bubble[i];
								ctx.moveTo(p.x, p.y);
								ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
							}
						}ctx.fill();
						//class updade to help them move
						update();
					}
					
					//Function to move the snowflakes
					//angle will be an ongoing incremental flag. Sin and Cos functions will be applied to it to create vertical and horizontal movements of the flakes
					var angle = 0;
					function update() {
						angle += 0.01;
						if(that.state.background === "snowy"){
							for(var i = 0; i < 500; i++) {
								var p = that.state.anamation.snow[i];
								//Updating X and Y coordinates
								//We will add 1 to the cos function to prevent negative values which will lead flakes to move upwards
								//Every particle has its own density which can be used to make the downward movement different for each flake
								//Lets make it more random by adding in the radius
								p.y += Math.cos(angle+p.d) + 1 + p.r/2;
								p.x += Math.sin(angle) * 2;
								
								//Sending flakes back from the top when it exits
								//Lets make it a bit more organic and let flakes enter from the left and right also.
								if(p.x > W+5 || p.x < -5 || p.y > H) {
									if(i%3 > 0) { //66.67% of the flakes
										that.state.anamation.snow[i] = {x: Math.random()*W, y: -10, r: p.r, d: p.d};
									}
									else {
										//If the flake is exitting from the right
										if(Math.sin(angle) > 0) {
											//Enter from the left
											that.state.anamation.snow[i] = {x: -5, y: Math.random()*H, r: p.r, d: p.d};
										}
										else {
											//Enter from the right
											that.state.anamation.snow[i] = {x: W+5, y: Math.random()*H, r: p.r, d: p.d};
										}
									}
								}
							}
						}
						if(that.state.background === "sea"){
							for(var i = 0; i < 20; i++) {
								var p = that.state.anamation.bubble[i];
								//Updating X and Y coordinates
								//We will add 1 to the cos function to prevent negative values which will lead flakes to move upwards
								//Every particle has its own density which can be used to make the downward movement different for each flake
								//Lets make it more random by adding in the radius
								p.y -= Math.cos(angle+p.d) + 1 + p.r/2;
								p.x += Math.sin(angle) * 2;
								
								//Sending flakes back from the top when it exits
								//Lets make it a bit more organic and let flakes enter from the left and right also.
					
								if(p.x > W+5 || p.x < -5 || p.y < 0) {
									if(i%3 > 0) { //66.67% of the flakes
										that.state.anamation.bubble[i] = {x: Math.random()*W, y: H, r: p.r, d: p.d};
									}
									else {
										//If the flake is exitting from the right
										if(Math.sin(angle) > 0) {
											//Enter from the left
											that.state.anamation.bubble[i] = {x: -5, y: Math.random()*H, r: p.r, d: p.d};
										}
										else {
											//Enter from the right
											that.state.anamation.bubble[i] = {x: W+5, y: Math.random()*H, r: p.r, d: p.d};
										}
									}
								}
							}
						}
					}
					
					//animation loop
					setInterval(draw, 33)		
				}
			drawEffect(); // calls function once ( drawEffect is kinda like and iffi)
	}
	render() {
		return ( 
		<div>
			<canvas className="back" id={this.state.background}></canvas> 
		</div>
		)// canvas to draw on
	}
}
