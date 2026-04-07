import Phaser from 'phaser';
import {
  addForageItem,
  canAddForageItem,
  countItem,
  removeForageItems,
  type BagState,
} from '../core/inventory';
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
  private bag: BagState = this.saveData.bag;
  private kitchenHerbCount = 0;

  private lastGroundedAt = 0;
  private jumpQueuedAt = -99999;
  private prevJumpDown = false;

  constructor() {
    super('vertical-slice');
  }

  create(): void {
    this.saveData = loadSave();
    this.bag = this.saveData.bag;
    this.kitchenHerbCount = this.saveData.kitchenInventory.wild_herb;

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
    this.input.keyboard?.on('keydown-E', () => this.tryPrimaryInteract());
    this.input.keyboard?.on('keydown-Q', () => this.tryKitchenWithdraw());

    this.infoText = this.add
      .text(16, 12, '', { color: '#ffffff', fontSize: '17px' })
      .setScrollFactor(0);
    this.hintText = this.add
      .text(16, 54, '', { color: '#ffe7a6', fontSize: '16px' })
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
      this.tryPrimaryInteract();
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
      this.hintText.setText('Press [E] to pick herb');
      return;
    }
    if (nearKitchen) {
      this.hintText.setText('Kitchen: [E] deposit all herbs, [Q] withdraw one');
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
      'Move: ← →, Jump: ↑ (buffer+coyote), Interact: E/Space, Withdraw: Q',
    );
  }

  private tryPrimaryInteract(): void {
    const nearIngredient =
      this.player.x > 1450 && this.player.x < 1555 && this.ingredient.active;

    if (nearIngredient && canAddForageItem(this.bag)) {
      this.bag = addForageItem(this.bag, 'wild_herb');
      this.ingredient.disableBody(true, true);
      this.refreshUi();
      return;
    }

    const nearKitchen = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.kitchenZone.getBounds(),
    );
    if (nearKitchen) {
      this.tryKitchenDeposit();
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

  private tryKitchenDeposit(): void {
    if (this.bag.mode !== 'forage') {
      this.refreshUi('Nothing storable in kitchen.');
      return;
    }

    const herbCount = countItem(this.bag, 'wild_herb');
    if (herbCount <= 0) {
      this.refreshUi('No herbs to deposit.');
      return;
    }

    this.kitchenHerbCount += herbCount;
    this.bag = removeForageItems(this.bag, herbCount);

    if (!this.ingredient.active) {
      this.ingredient.enableBody(true, 1500, 470, true, true);
    }

    this.refreshUi(`Deposited ${herbCount} herb(s).`);
  }

  private tryKitchenWithdraw(): void {
    const nearKitchen = Phaser.Geom.Intersects.RectangleToRectangle(
      this.player.getBounds(),
      this.kitchenZone.getBounds(),
    );

    if (!nearKitchen) return;

    if (this.kitchenHerbCount <= 0) {
      this.refreshUi('Kitchen has no herbs.');
      return;
    }

    if (!canAddForageItem(this.bag)) {
      this.refreshUi('Bag full or blocked by sick animal.');
      return;
    }

    this.kitchenHerbCount -= 1;
    this.bag = addForageItem(this.bag, 'wild_herb');
    this.refreshUi('Withdrew 1 herb.');
  }

  private refreshUi(note = ''): void {
    const zone: Zone = this.player?.x > 900 ? 'forest' : 'home';
    const herbInBag = countItem(this.bag, 'wild_herb');

    this.infoText.setText(
      [
        `Zone: ${zone}`,
        `Bag mode: ${this.bag.mode}`,
        `Bag herbs: ${herbInBag}/4`,
        `Kitchen herbs: ${this.kitchenHerbCount}`,
        note,
      ]
        .filter(Boolean)
        .join('  |  '),
    );
  }

  private persist(): void {
    if (!this.player) return;

    writeSave({
      bag: this.bag,
      kitchenInventory: {
        wild_herb: this.kitchenHerbCount,
      },
      playerX: this.player.x,
      playerY: this.player.y,
    });
  }
}
