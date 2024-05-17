class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.score = 0;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        const objectsLayer = this.map.getObjectLayer('Objects');
        const startPoint = objectsLayer.objects.find(obj => obj.name === "startPoint");
        this.spawnPoint = { x: startPoint.x, y: startPoint.y };

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.desu = false;

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Create the score text
        this.scoreText = this.add.text(16, 16, "Score: " + this.score, { fontSize: '16px' });
        // Cant get this to work =(
        //this.scoreText.setScrollFactor(0);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.water = this.map.createFromObjects("Objects", {
            name: "water",
            key: "tilemap_sheet",
            frame: 33
        });

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.water, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.waterGroup = this.add.group(this.water);

        // Play the coin animation for each coin
        this.water.forEach((water) => {
            water.anims.play('waterMotion');
        });

        my.vfx.waterSplash = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_09.png', 'star_08.png'],
            random: true,
            scale: { start: 0.03, end: 0.1 },
            maxAliveParticales: 8,
            lifespan: 150,
            gravityY: - 400,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.waterSplash.stop();

        // Handle collision detection with water
        this.physics.add.overlap(my.sprite.player, this.waterGroup, (obj1, obj2) => {
            if (!my.sprite.player.desu) {
                my.vfx.waterSplash.emitParticleAt(obj2.x, obj2.y, 10);
                this.respawn();
            }
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // Play the coin animation for each coin
        this.coins.forEach((coin) => {
            coin.anims.play('coinSpin');
        });

        my.vfx.coinGet = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_09.png', 'star_08.png'],
            random: true,
            scale: { start: 0.03, end: 0.1 },
            maxAliveParticales: 8,
            lifespan: 150,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.coinGet.stop();

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            my.vfx.coinGet.emitParticleAt(obj2.x, obj2.y, 10);
            this.score++;
            this.scoreText.setText("Score: " + this.score);
        });

        this.powerUp = this.map.createFromObjects("Objects", {
            name: "powerUp",
            key: "tilemap_sheet",
            frame: 67
        });

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.powerUp, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.powerUpGroup = this.add.group(this.powerUp);

        my.vfx.powerUpGet = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_09.png', 'star_08.png'],
            random: true,
            scale: { start: 0.03, end: 0.1 },
            maxAliveParticales: 8,
            lifespan: 150,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.powerUpGet.stop();

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.powerUpGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            my.vfx.powerUpGet.emitParticleAt(obj2.x, obj2.y, 10);
            this.powerUpJump();
        });


        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // sprite console log (assigned to S key)
        this.input.keyboard.on('keydown-S', () => {
            console.log(my.sprite.player);
        }, this);

        // TODO: Add movement vfx here
        // movement vfx
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            random: true,
            scale: { start: 0.03, end: 0.1 },
            maxAliveParticales: 8,
            lifespan: 350,
            gravityY: -400,
            alpha: { start: 1, end: 0.1 },
        });

        my.vfx.walking.stop();
    }

    powerUpJump() {
        this.JUMP_VELOCITY = -600;
        this.JUMP_VELOCITY -= 200;
        this.time.delayedCall(5000, () => {
            this.JUMP_VELOCITY = -600;
        });
    }

    respawn() {
        this.time.delayedCall(500, () => {
            my.sprite.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
            my.sprite.player.desu = false;
            my.sprite.player.active = true;
        });
        my.sprite.player.desu = true;
        my.sprite.player.active = false;

        my.sprite.player.body.setVelocityX(0);
        my.sprite.player.body.setVelocityY(0);
        my.sprite.player.body.setAccelerationX(0);
        my.sprite.player.body.setAccelerationY(0);
    }

    update() {
        if (cursors.left.isDown && my.sprite.player.active) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 5, my.sprite.player.displayHeight / 2 - 5, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            }
            else {
                my.vfx.walking.stop();
            }

        } else if (cursors.right.isDown && my.sprite.player.active) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 20, my.sprite.player.displayHeight / 2 - 5, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            }
            else {
                my.vfx.walking.stop();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && my.sprite.player.active) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}