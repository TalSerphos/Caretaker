import Phaser from 'phaser';
import { featureFlags, movementTuning } from '../core/config';
import { loadSave, writeSave, type SaveData } from '../core/save';

type Zone = 'home' | 'forest';

export class VerticalSliceScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private infoText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private ingredient!: Phaser.Physics.Arcade.Sprite;
  private kitchenZone!: Phaser.GameObjects.Zone;
  private doorToForest!: Phaser.GameObjects.Zone;
  private doorToHome!: Phaser.GameObjects.Zone;

  private saveData: SaveData = loadSave();
  private bagIngredientCount = 0;

  private lastGroundedAt = 0;
  private jumpQueuedAt = -99999;
  private prevJumpDown = false;

  constructor() {
    super('vertical-slice');
  }

  create(): void {
    this.saveData = loadSave();
    this.bagIngredientCount = this.saveData.bagIngredientCount;

    this.physics.world.setBounds(0, 0, 2200, 720);

    this.add.rectangle(450, 360, 900, 720, 0x312823).setDepth(-20);
    this.add.rectangle(1550, 360, 1300, 720, 0x243324).setDepth(-20);

    this.add.text(220, 80, 'Home Room', { color: '#f2dfc5', fontSize: '26px' });
    this.add.text(1240, 80, 'Forest (tiny stub)', {
      color: '#d2e4be',
      fontSize: '26px',
    });

    const ground = this.add.rectangle(1100, 640, 2200, 160, 0x4a3e2d);
    this.physics.add.existing(ground, true);

    const platform = this.add.rectangle(1550, 520, 260, 24, 0x5b6a4e);
    this.physics.add.existing(platform, true);

    this.kitchenZone = this.add.zone(280, 560, 120, 120);
    this.add
      .rectangle(280, 560, 120, 120, 0x7f5f44)
      .setStrokeStyle(2, 0xcfa87a)
      .setDepth(-1);
    this.add.text(230, 510, 'Kitchen', { color: '#f2dfc5', fontSize: '18px' });

    this.doorToForest = this.add.zone(820, 540, 70, 160);
    this.add
      .rectangle(820, 540, 70, 160, 0x35543d)
      .setStrokeStyle(2, 0x9cb68d)
      .setDepth(-1);
    this.add.text(770, 450, 'To Forest', {
      color: '#d2e4be',
      fontSize: '16px',
    });

    this.doorToHome = this.add.zone(900, 540, 70, 160);
    this.add
      .rectangle(900, 540, 70, 160, 0x4e3d5e)
      .setStrokeStyle(2, 0xb7a7c8)
      .setDepth(-1);
    this.add.text(864, 450, 'To Home', { color: '#e7ddf6', fontSize: '16px' });

    this.player = this.physics.add.sprite(
      this.saveData.playerX,
      this.saveData.playerY,
      '__MISSING',
    );
    this.player.setDisplaySize(28, 44);
    this.player.setTint(0xffe3c0);
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(
      movementTuning.maxRunSpeed,
      movementTuning.maxFallVelocity,
    );

    this.ingredient = this.physics.add.sprite(1500, 470, '__MISSING');
    this.ingredient.setDisplaySize(20, 20);
    this.ingredient.setTint(0xf6a04d);
    const ingredientBody = this.ingredient
      .body as Phaser.Physics.Arcade.Body | null;
    ingredientBody?.setAllowGravity(false);

    this.physics.add.collider(
      this.player,
      ground as unknown as Phaser.Physics.Arcade.Body,
    );
    this.physics.add.collider(
      this.player,
      platform as unknown as Phaser.Physics.Arcade.Body,
    );

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard?.on('keydown-E', () => this.tryInteract());

    this.infoText = this.add
      .text(16, 12, '', { color: '#ffffff', fontSize: '18px' })
      .setScrollFactor(0);
    this.hintText = this.add
      .text(16, 40, '', { color: '#ffe7a6', fontSize: '16px' })
      .setScrollFactor(0);

    this.cameras.main.setBounds(0, 0, 2200, 720);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.refreshUi();

    this.events.on('shutdown', () => this.persist());
    this.events.on('destroy', () => this.persist());
  }

  update(time: number, delta: number): void {
    const dt = delta / 1000;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const grounded = body.blocked.down;
    if (grounded) {
      this.lastGroundedAt = time;
    }

    this.handleHorizontalMovement(dt, grounded);
    this.handleJumpQueue(time, grounded);

    this.updateHint();

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      this.tryInteract();
    }
  }

  private handleHorizontalMovement(dt: number, grounded: boolean): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const inputX =
      (this.cursors.left?.isDown ? -1 : 0) +
      (this.cursors.right?.isDown ? 1 : 0);

    const accel = grounded
      ? movementTuning.groundAcceleration
      : movementTuning.airAcceleration;
    const drag = grounded ? movementTuning.groundDrag : movementTuning.airDrag;

    if (inputX !== 0) {
      const nextVelocityX = Phaser.Math.Clamp(
        body.velocity.x + inputX * accel * dt,
        -movementTuning.maxRunSpeed,
        movementTuning.maxRunSpeed,
      );
      body.setVelocityX(nextVelocityX);
    } else {
      const towardZero = Math.sign(body.velocity.x) * drag * dt;
      if (Math.abs(towardZero) > Math.abs(body.velocity.x)) {
        body.setVelocityX(0);
      } else {
        body.setVelocityX(body.velocity.x - towardZero);
      }
    }

    if (featureFlags.movement.wallKit && !grounded) {
      // Placeholder for M2 wall-slide/wall-jump extension.
    }
  }

  private handleJumpQueue(time: number, grounded: boolean): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const jumpDown = Boolean(this.cursors.up?.isDown);

    if (jumpDown && !this.prevJumpDown) {
      this.jumpQueuedAt = time;
    }
    this.prevJumpDown = jumpDown;

    const withinBuffer =
      time - this.jumpQueuedAt <= featureFlags.movement.jumpBufferMs;
    const withinCoyote =
      time - this.lastGroundedAt <= featureFlags.movement.coyoteTimeMs;

    if (withinBuffer && (grounded || withinCoyote)) {
      body.setVelocityY(-movementTuning.jumpVelocity);
      this.jumpQueuedAt = -99999;
      this.lastGroundedAt = -99999;
    }

    // Variable jump height: releasing jump early cuts upward momentum.
    if (!jumpDown && body.velocity.y < -120) {
      body.setVelocityY(body.velocity.y * 0.62);
    }
  }

  private updateHint(): void {
    const nearIngredient =
      this.player.x > 1450 && this.player.x < 1555 && this.ingredient.active;
    const nearKitchen = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.kitchenZone.getBounds(),
    );

    const nearForestDoor = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.doorToForest.getBounds(),
    );

    const nearHomeDoor = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.doorToHome.getBounds(),
    );

    if (nearIngredient) {
      this.hintText.setText('Press [E] to pick ingredient');
      return;
    }
    if (nearKitchen) {
      this.hintText.setText('Press [E] to deposit ingredient in kitchen');
      return;
    }
    if (nearForestDoor) {
      this.hintText.setText('Press [E] to enter forest');
      return;
    }
    if (nearHomeDoor) {
      this.hintText.setText('Press [E] to return home');
      return;
    }

    this.hintText.setText(
      'Move: ← →, Jump: ↑ (buffer+coyote), Interact: E/Space',
    );
  }

  private tryInteract(): void {
    const nearIngredient =
      this.player.x > 1450 && this.player.x < 1555 && this.ingredient.active;

    if (nearIngredient && this.bagIngredientCount === 0) {
      this.bagIngredientCount = 1;
      this.ingredient.disableBody(true, true);
      this.refreshUi();
      return;
    }

    const nearKitchen = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.kitchenZone.getBounds(),
    );
    if (nearKitchen && this.bagIngredientCount > 0) {
      this.bagIngredientCount = 0;
      this.ingredient.enableBody(true, 1500, 470, true, true);
      this.refreshUi();
      return;
    }

    const nearForestDoor = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.doorToForest.getBounds(),
    );
    if (nearForestDoor) {
      this.player.setPosition(1200, 520);
      this.refreshUi('Entered forest stub.');
      return;
    }

    const nearHomeDoor = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.doorToHome.getBounds(),
    );
    if (nearHomeDoor) {
      this.player.setPosition(720, 520);
      this.refreshUi('Returned home room.');
    }
  }

  private refreshUi(note = ''): void {
    const zone: Zone = this.player?.x > 900 ? 'forest' : 'home';
    this.infoText.setText(
      [
        `Zone: ${zone}`,
        `Bag ingredient slots used: ${this.bagIngredientCount}/1`,
        note,
      ]
        .filter(Boolean)
        .join('  |  '),
    );
  }

  private persist(): void {
    if (!this.player) return;

    writeSave({
      bagIngredientCount: this.bagIngredientCount,
      playerX: this.player.x,
      playerY: this.player.y,
    });
  }
}
