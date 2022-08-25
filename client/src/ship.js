export default class Ship extends Phaser.GameObjects.Sprite {

    constructor(scene, socketId, x, y, rotation, playerName, colour) {
        super(scene, x, y);
        this.rotation = rotation;

        // Socket connection ID
        this.socketId = socketId;

        // Text underneath ship alignment properties.
        this.nameAlignX = 20;
        this.nameAlignY = 45;

        // Default ship properties
        this.playerName = playerName;
        this.colour = colour;
        this.boostActive = false;
        this.shipWidth = 13.5;
        this.shipHeight = 10;

        this.killCount = {
            "count": 0,
            "text": null
        };

        // Enabling physics for this object is crucial + set world boundaries
        scene.physics.world.enable(this, Phaser.Physics.ARCADE);
        scene.add.existing(this).setOrigin(0.5, 0.5).setDisplaySize(this.shipWidth, this.shipHeight).play('launch');

        // Add text underneath sprite
        let style = { font: "13px Calibri, Arial", fill: colour, wordWrap: true, align: "center", stroke: '#000000', strokeThickness: 0.5 };
        this.entityText = scene.add.text(x - this.nameAlignX, y + this.nameAlignY, playerName, style);

        // Collision and bounce physics must be done after adding ship to scene.
        this.body.setSize(200, 200).setOffset(0, 0);
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);

        // We used setDrag, setAngularDrag, and setMaxVelocity to modify how the game object reacts to the arcade physics. 
        this.body.setDrag(100);
        this.body.setAngularDrag(100);
        this.body.setMaxVelocity(500);
    }

    initializeAmmunitionSystem(scene) {
        this.lasers = scene.physics.add.group();
        this.lasers.enableBody = true;
        this.lasers.maxSize = 12;
        this.lasers.magazineSize = 12;
        this.lasers.magazineLimit = 4
        this.lasers.currentMagazineAmmo = this.lasers.magazineSize;

        this.meteorShots = scene.physics.add.group();
        this.meteorShots.enableBody = true;
        this.meteorShots.maxSize = 10;
        this.meteorShots.ammo = 10;
    }

    // TODO: Move to dedicated class - Ship should not manage these details.
    initializeAmmunitionUserInterface(scene) {
        const laserAmmoText = this.lasers.currentMagazineAmmo.toString() + "|" + this.lasers.magazineLimit.toString();
        this.lasers.ui = scene.add.bitmapText(748, scene.scale.height, 'arcadeFont', laserAmmoText, 16)
            .setOrigin(1, 2)
            .setDropShadow(1, 2, 0x000000, 1)
            .setScrollFactor(0);

        const meteorShotSpriteId = 'ammo_' + this.meteorShots.ammo.toString();
        // Set meteor shot ammo sprite
        this.meteorShots.ui = scene.physics.add.sprite(scene.scale.width, scene.scale.height, meteorShotSpriteId)
            .setOrigin(1.5, 1.15)
            .setScale(1, 1)
            .setScrollFactor(0);
        
        this.killCount.text = scene.add.bitmapText(100, scene.scale.height, 'arcadeFont', 'Kills: ' + this.killCount.count, 16)
            .setOrigin(1, 2)
            .setDropShadow(1, 2, 0x000000, 1)
            .setScrollFactor(0);
    }

    // Check for bullet fire by pressing the 'x' key
    // This function is automatically called after each 'x' key press.
    fire_laser(scene) {
        // Check bullet exists
        if (this.lasers.currentMagazineAmmo > 0) {
            // TODO: Refactor this groupness, the group isn't being used as such.
            let bullet = this.lasers.get(this.x, this.y, "player_laser_shoot_1");
		
            // reduce ammo count
            this.lasers.currentMagazineAmmo--;
             
            // Set bullet properties
            bullet.rotation = this.rotation;
            scene.physics.velocityFromRotation(this.rotation, 600, bullet.body.velocity);
            bullet.setActive(true);
            bullet.setVisible(true);

            // Emit to all other players
            scene.socket.emit('bulletFired', {
				x: bullet.x, 
				y: bullet.y, 
				rotation: bullet.rotation, 
				velocity: bullet.body.velocity
			});

            // Update bullet UI
            this.updateBulletAmmoUi();
        }
    }

    // Different colour
	// TODO: Investigate if we need meteorShots.ammo here, and rather if we can just use the meteorShots group.
    fire_meteor_shot(scene) {
        if (this.meteorShots.ammo > 0) {
        	var meteor_projectile_bullet = this.meteorShots.get(this.x, this.y, "player_laser_shoot_1")
            this.meteorShots.ammo--;

            meteor_projectile_bullet.setScale(3, 3);
            this.meteorShots.ui.setTexture("ammo_" + this.meteorShots.ammo.toString());

            meteor_projectile_bullet.rotation = this.rotation;
            scene.physics.velocityFromRotation(this.rotation, 600, meteor_projectile_bullet.body.velocity);
            meteor_projectile_bullet.setActive(true);
            meteor_projectile_bullet.setVisible(true);

            // Emit to all other players
            scene.socket.emit('meteorFired', {
				x: meteor_projectile_bullet.x, 
				y: meteor_projectile_bullet.y, 
				rotation: meteor_projectile_bullet.rotation, 
				velocity: meteor_projectile_bullet.body.velocity
			});
    	}
	}

    // Removes all members of this Group and optionally removes them from the Scene and / or destroys them.
    reload() {
        if (this.lasers.currentMagazineAmmo < this.lasers.magazineSize && this.lasers.magazineLimit > 0) {
            this.lasers.magazineLimit--;
            this.lasers.currentMagazineAmmo = this.lasers.magazineSize;            
            this.lasers.children.clear(true, false);
            this.updateBulletAmmoUi();
        }
    }
    
    // This function allows us to 'reload' effectively after the bullets go off the screen.
    updateBulletAmmoUi() {
        this.lasers.ui.setText(this.lasers.currentMagazineAmmo.toString() + "|" + this.lasers.magazineLimit.toString());
    }

    deleteUserInterface() {
        this.lasers.ui.destroy();
        this.meteorShots.ui.destroy();
    }

    incrementKillCount() {
        this.killCount.count++;
        this.killCount.text.setText("Kills: " + this.killCount.count)
    }
}
