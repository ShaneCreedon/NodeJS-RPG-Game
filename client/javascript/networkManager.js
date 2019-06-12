export default class NetworkManager {

    constructor(SpriteClass) {
        this.SpriteClass = SpriteClass;
        this.boostActive = false;
    }

    // External Functions
    addPlayer(self, playerInfo) {

        // Use physics object to enable arcade physics with our ship.
        // Set origin of the object to be the centre rather than the top left -> This allows us to rotate around the origin with ease.
        // Set scale of object (object size)
        this.buildPlayerAnimationFrames(self);
    
        self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player_anim_1').setOrigin(0.5, 0.5).setDisplaySize(80, 60).play('launch');
        self.ship.body.collideWorldBounds = true;
        self.ship.setBounce(1);

        // Add the text to the sprite as a child, just like a group spriteText.x = spriteText.width * -0.5; 
        // Center the text sprite text.y = -10 
        // Position the text 10 pixels above the origin of the sprite

        // We used setDrag, setAngularDrag, and setMaxVelocity to modify how the game object reacts to the arcade physics. 
        self.ship.setDrag(100);
        self.ship.setAngularDrag(100);
        self.ship.setMaxVelocity(500);
    }

    addOtherPlayer(self, playerInfo) {
                
        // Use physics object to enable arcade physics with our ship.
        // Set origin of the object to be the centre rather than the top left -> This allows us to rotate around the origin with ease.
        // Set scale of object (object size)
        this.buildPlayerAnimationFrames(self);
        this.SpriteClass.prototype.boostActive = self.boostActive;

        const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player_anim_1').setOrigin(0.5, 0.5).setDisplaySize(80, 60).play('launch');
        otherPlayer.playerId = playerInfo.playerId;
        self.otherPlayers.add(otherPlayer);
    }

    /* Player Movement */
    /* Player Shooting */
    checkForPlayerInteraction(self) {

        // Check left key is down
        if (self.cursors.left.isDown) {
            self.ship.setAngularVelocity(-150);

        // Check right key is down
        } else if (self.cursors.right.isDown) {
            self.ship.setAngularVelocity(150);

        // Otherwise, stop velocity
        } else {
            self.ship.setAngularVelocity(0);
        }
    
        // Check up key is down
        if (self.cursors.up.isDown) {
            self.physics.velocityFromRotation(self.ship.rotation + 270, 50, self.ship.body.acceleration);
        } else {
            self.ship.setAcceleration(0);
            // Todo: Turn off engine
        }

        // Check for space bar push => instantiates engine thrusters 
        if (self.cursors.space.isDown) {
            // Increase the acceleration of the ship - Thus increasing its velocity when moving.
            self.physics.velocityFromRotation(self.ship.rotation + 270, 300, self.ship.body.acceleration);
            // Update animation
            if (!self.boostActive) {
                self.ship.anims.stop('launch');
                self.ship.anims.play('boost');
                self.boostActive = true;
            }
        }
        else {
            if (self.boostActive) {
                self.ship.anims.stop('boost');
                self.ship.anims.play('launch');
                self.boostActive = false;
            }
        }
    }

    publishPlayerMovement(self) {
        // emit player movement
        var x = self.ship.x;
        var y = self.ship.y;
        var r = self.ship.rotation;
        if (self.ship.oldPosition && (x !== self.ship.oldPosition.x || y !== self.ship.oldPosition.y || r !== self.ship.oldPosition.rotation)) {
            self.socket.emit('playerMovement', { x: self.ship.x, y: self.ship.y, rotation: self.ship.rotation, boostActive: self.boostActive });
        }
        
        // save old position data
        self.ship.oldPosition = {
            x: self.ship.x,
            y: self.ship.y,
            rotation: self.ship.rotation,
            boostActive: self.ship.boostActive
        };  
    }

    checkForThrusterInitiation(playerInfo, otherPlayer) {
        if (playerInfo.boostActive && otherPlayer.anims.currentAnim.key == "launch") {
            otherPlayer.anims.stop('launch');
            otherPlayer.anims.play('boost');
        }
        else if (!playerInfo.boostActive && otherPlayer.anims.currentAnim.key == "boost") {
            otherPlayer.anims.stop('boost');
            otherPlayer.anims.play('launch');
        }
    }

    buildPlayerAnimationFrames(self) {

        // Normal Launch Animation
        self.anims.create({
            key: 'launch',
            frames: [
                { key: 'player_anim_1' },
                { key: 'player_anim_2' },
                { key: 'player_anim_3' },
                { key: 'player_anim_4' },
                { key: 'player_anim_5' },
                { key: 'player_anim_6' },
                { key: 'player_anim_7' },
                { key: 'player_anim_8', duration: 10 }
            ],
            frameRate: 16,
            repeat: -1
        });

        // Engine Thruster Boost Animation
        self.anims.create({
            key: 'boost',
            frames: [
                { key: 'player_boost_anim_1' },
                { key: 'player_boost_anim_2' },
                { key: 'player_boost_anim_3' },
                { key: 'player_boost_anim_4' },
                { key: 'player_boost_anim_5' },
                { key: 'player_boost_anim_6' },
                { key: 'player_boost_anim_7' },
                { key: 'player_boost_anim_8', duration: 10 }
            ],
            frameRate: 16,
            repeat: -1
        });
    }
}