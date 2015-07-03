;(function() {
	'use strict';

	var PhysicsEntity = function(options) {
		var that = this;

		if (options && options.className) {
			className = options.className;
		}
		
		this.restitution = (options && options.restitution)?options.restitution:0.8;
		this.friction = (options && options.friction)?options.friction:0.3;

		this.width = (options && options.width)?options.width:20;
		this.height = (options && options.height)?options.height:20;

		this.x = (options && options.x)?options.x:0;
		this.y = (options && options.y)?options.y:0;

		this.type = (options && options.type)?options.type:'moving';
		this.mass = (options && options.mass)?options.mass:1;
		
		this.vx = 0;
		this.vy = 0;

		this.ax = 0;
		this.ay = 0;

		this.halfWidth = this.width * .5;		
		this.halfHeight = this.height * .5;

		this.getMidX = function() {
			return that.halfWidth + that.x;
		};

		this.getMidY = function() {
			return that.halfHeight + that.y;
		};

		this.getTop = function() {
			return that.y;
		};
		this.getLeft = function() {
			return that.x;
		};
		this.getRight = function() {
			return that.x + that.width;
		};
		this.getBottom = function() {
			return that.y + that.height;
		};
		this.getMass = function(){
			return that.mass;
		};

	};

	var isColliding = function(collider, collidee) {

		var l1 = collider.getLeft();
		var t1 = collider.getTop();
		var r1 = collider.getRight();
		var b1 = collider.getBottom();
		
		var l2 = collidee.getLeft();
		var t2 = collidee.getTop();
		var r2 = collidee.getRight();
		var b2 = collidee.getBottom();
		
		if (b1 < t2 || t1 > b2 || r1 < l2 || l1 > r2) {
			return false;
		} else {
			//console.log('coll');
			return true;
		};
	};

	var resolveCollision = function(collider, collidee) {
		//debugger;
		var stickyThreshold = 1; //.0004;

		var rMidX = collider.getMidX();
		var rMidY = collider.getMidY();
		var eMidX = collidee.getMidX();
		var eMidY = collidee.getMidY();
		
		var dx = (eMidX - rMidX) / collidee.halfWidth;
		var dy = (eMidY - rMidY) / collidee.halfHeight;

		var absDX = Math.abs(dx);
		var absDY = Math.abs(dy);
		
		//debugger;

		function elasticCollision(o){
			if(o == 'x'){
				if(collidee.type != 'fixed'){
						var eVX = collidee.vx;
						var rVX = collider.vx;
						var dVX = eVX - rVX;
						collider.vx = (((collider.mass*rVX) + (collidee.mass*eVX) + (collidee.mass*collidee.restitution)*(dVX))/(collider.mass+collidee.mass));
						collidee.vx = (((collidee.mass*eVX) + (collider.mass*rVX) + (collider.mass*collider.restitution)*(-dVX))/(collidee.mass+collider.mass));

					}
					else {
						collider.vx = -collider.vx * collidee.restitution;
					};

					if (Math.abs(collider.vx) < stickyThreshold) {
						collider.vx = 0;
					};
					if (Math.abs(collidee.vx) < stickyThreshold) {
						collidee.vx = 0;
					};			
			};

			if(o == 'y'){
				if(collidee.type != 'fixed'){
						var eVY = collidee.vy;
						var rVY = collider.vy;
						var dVY = eVY - rVY;
						collider.vy = (((collider.mass*rVY) + (collidee.mass*eVY) + (collidee.mass*collidee.restitution)*(dVY))/(collider.mass+collidee.mass));
						collidee.vy = (((collidee.mass*eVY) + (collider.mass*rVY) + (collider.mass*collider.restitution)*(-dVY))/(collidee.mass+collider.mass));

					}
					else {
						collider.vy = -collider.vy * collidee.restitution;
					};

					if (Math.abs(collider.vy) < stickyThreshold) {
						collider.vy = 0;
					};
					if (Math.abs(collidee.vy) < stickyThreshold) {
						collidee.vy = 0;
					};			
			};

		};

		if (Math.abs(absDX - absDY) < .1) {

			if (dx < 0) {
				collider.x = collidee.getRight();
			} else {
				collider.x = collidee.getLeft() - collider.width;
			};
			
			if (dy < 0) {
				collider.y = collidee.getBottom();
			} else {
				collider.y = collidee.getTop() - collider.height;
			};

			if (Math.random() < .5) {
				elasticCollision('x')
				
			} else {
				elasticCollision('y');
			};	
		} else if (absDX > absDY) {
			if (dx < 0) {
				collider.x = collidee.getRight();
			} else {
				collider.x = collidee.getLeft() - collider.width;
			};
			
			elasticCollision('x')

		} else {

			if (dy < 0) {
				collider.y = collidee.getBottom();

			} else {
				collider.y = collidee.getTop() - collider.height;
			};
			
			elasticCollision('y')
		};

		//(collider.vx ? !collider.vy :collider.vy)){ 				//foo ? !bar : bar XOR
		//console.log(collider.x, collider.y, collider.ax, collider.ay, collider.vx, collider.vy);
		if(collidee.type === 'fixed'){
			(Math.abs(collider.vx)>1)?(collider.vx = collider.vx * (1 - collider.friction * collidee.friction)):(collider.vx=0);
			(Math.abs(collider.vy)>1)?(collider.vy = collider.vy * (1 - collider.friction * collidee.friction)):(collider.vy=0);
		};
	};

	var Engine = function() {

		var gravityX = 0;
		var gravityY = 10;

		var entities = [];

		this.addEntity = function(phyEty){
			entities.push(phyEty);
		};
		
		this.step = function(elapsed){

			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				if(entity.type != 'fixed'){
					
					entity.vx += (/*entity.ax+ */gravityX)  * elapsed ;
					entity.vy += (/*entity.ay+ */gravityY) * elapsed ;
					entity.x  += entity.vx * elapsed;
					entity.y  += entity.vy * elapsed;


					for(var j = 0; j < entities.length; j++){
						if(i!==j){
							if(isColliding(entity,entities[j])){
								resolveCollision(entity, entities[j]);
								//if(entities[j].type != 'fixed' ) resolveCollision(entities[j], entity);
							};
						};
					};

					/*if (entity.x>2700){
						debugger;
					}*/
					console.log(i, entity.x, entity.y, entity.vx, entity.vy)

					
				};
				//console.log(entity.x, entity.y, entity.vx, entity.vy ,entity.type);
			};
		};

	};

	window.Engine = Engine;
	window.PhysicsEntity = PhysicsEntity;
	

})();