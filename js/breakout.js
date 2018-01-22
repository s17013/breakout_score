window.addEventListener('DOMContentLoaded', () => {
    // 初期化
    const canvas = document.getElementById('board');
    new Breakout({
        canvas: canvas,
        interval: 1000 / 60,    // 60 FPS
        paddle: {
            width: 100,
            height: 10,
            color: '#4169e1'    // 'royalblue'
        },
        ball: {
            radius: 5,
            color: 'white'      // '#FFffFF'
        },
        block: {
            width: 80,
            height: 20
        }
    });
});

class Breakout {
    static set width(w) {
        Breakout.gameWidth = w;
    }

    static get width() {
        return Breakout.gameWidth;
    }

    static set height(h) {
        Breakout.gameHight = h;
    }

    static get height() {
        return Breakout.gameHight;
    }

    static get isGameOver() {
        return Breakout._game_over === true;
    }

    static setGameOver(f) {
        if (f instanceof Boolean) {
            Breakout._game_over = f;
            return;
        }
        Breakout._game_over = true;
    }

    constructor(options) {
        // 受け取ったパラメータをプロパティに保存
        this.canvas = options.canvas;
        this.context = this.canvas.getContext('2d');
        // ゲーム画面のサイズを取得
        Breakout.width = this.canvas.width;
        Breakout.height = this.canvas.height;

        // 内部で使用するプロパティの初期化
        this.leftKey = false;
        this.rightKey = false;

        // Paddleの初期化
        this.paddle = new Paddle(
            options.paddle.width,
            options.paddle.height,
            options.paddle.color);

        this.paddle.setPosition(Breakout.width / 2,
            Breakout.height * 8 / 9);
        this.paddle.setSpeed(Breakout.width / 100);

        // ブロックマネージャの初期化
        this.blockManager = new BlockManager(
            options.block.width, options.block.height);
        this.blockManager.stage1();

        // ボールの初期化
        this.ball = new Ball(
            options.ball.radius, options.ball.color);
        this.ball.setPosition(Breakout.width / 2, Breakout.height / 2);

        // ボールに当たり判定してもらうおねがい
        this.ball.addTarget(this.paddle);
        this.ball.addTarget(this.blockManager.blockList);


        // 描画のためのタイマーセット
        setInterval(this.draw.bind(this), options.interval);

        window.addEventListener('keydown', this.keydown.bind(this));
        window.addEventListener('keyup', this.keyup.bind(this));
    }

    keydown(evt) {
        if (evt.code === 'ArrowLeft' /* ひだりキー */) {
            this.leftKey = true;
        } else if (evt.code === 'ArrowRight' /* みぎキー */) {
            this.rightKey = true;
        } else if (evt.code === 'Space') {
            // debug
            this.ball.setSpeed(5, 135);
        }
    }

    keyup(evt) {
        if (evt.code === 'ArrowLeft' /* ひだりキー */) {
            this.leftKey = false;
        } else if (evt.code === 'ArrowRight' /* みぎキー */) {
            this.rightKey = false;
        }
    }

    draw() {
        this.context.clearRect(0, 0, Breakout.width, Breakout.height);
        if (this.leftKey) {
            this.paddle.moveLeft();
        }
        if (this.rightKey) {
            this.paddle.moveRight();
        }
        if (Breakout.isGameOver) {
            this.context.save();

            this.context.fillStyle = "red";
            this.context.font = "48pt Arial";
            this.context.textAlign = "center";
            this.context.fillText("GameOver", Breakout.width / 2, Breakout.height / 2);

            this.context.restore();
        } else {
            this.ball.draw(this.context);
        }
        this.paddle.draw(this.context);
        this.blockManager.draw(this.context);
    }
}

class Entity {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    }

    getCornerPoints() {
        return [
            {x: this.x - this.width / 2, y: this.y - this.height / 2},
            {x: this.x + this.width / 2, y: this.y - this.height / 2},
            {x: this.x + this.width / 2, y: this.y + this.height / 2},
            {x: this.x - this.width / 2, y: this.y + this.height / 2}
        ]
    }

    hit(ball) {
    }
}

class Paddle extends Entity {
    constructor(width, height, color) {
        super();
        this.width = width;
        this.height = height;
        this.color = color;
        this.x = 0;
        this.y = 0;
        this.speed = 0;
    }

    /**
     * 描画処理するメソッド
     *
     * @param context CanvasRenderingContext2D
     */
    draw(context) {
        context.save();

        context.translate(this.x, this.y);
        context.fillStyle = this.color;
        context.fillRect(-(this.width / 2), -(this.height / 2),
            this.width, this.height);

        context.restore();
    }

    /**
     * 位置を指定した座標へ移動する
     * @param x
     * @param y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.fixPosition();
    }

    /**
     * 移動スピードを指定する
     * @param speed
     */
    setSpeed(speed) {
        this.speed = speed;
    }

    /**
     * ひだりへ移動する
     */
    moveLeft() {
        this.x -= this.speed;
        this.fixPosition();
    }

    /**
     * みぎへ移動する
     */
    moveRight() {
        this.x += this.speed;
        this.fixPosition();
    }

    /**
     * はみ出ないように位置を調整する
     */
    fixPosition() {
        const left = this.x - (this.width / 2);
        if (left < 0) {
            this.x += Math.abs(left);
        }

        const right = this.x + (this.width / 2);
        if (right > Breakout.width) {
            this.x -= right - Breakout.width;
        }
    }

    /**
     * 当たったあとのなにか
     */
    hit(ball) {
        // ボールがPaddleの右4分の1にあるか
        if (this.x + this.width / 4 < ball.x) {
            ball.changeAngle();
            return;
        }
        // ボールがPaddleの左4分の1にあるか
        if (this.x - this.width / 4 > ball.x) {
            ball.changeAngle(true);
        }
    }
}

class Block extends Entity {
    static get colorSet() {
        return [
            ['Pink', 'Crimson'],
            ['HotPink', 'DeepPink'],
            ['Violet', 'Magenta'],
            ['MediumOrchid', 'DarkOrchid'],
            ['MediumSlateBlue', 'DarkSlateBlue'],
            ['Blue', 'MidnightBlue'],
            ['LightSkyBlue', 'DeepSkyBlue'],
            ['Cyan', 'DarkCyan'],
            ['MediumAquamarine', 'MediumSpringGreen'],
            ['SpringGreen', 'SeaGreen'],
            ['DarkGreen', 'LawnGreen'],
            ['Yellow', 'Olive'],
            ['Gold', 'DarkGoldenrod'],
            ['Orange', 'DarkOrange'],
            ['Coral', 'OrangeRed'],
            ['Red', 'DarkRed'],
        ];
    }

    constructor(manager, x, y, width, height, color) {
        super();
        this.manager = manager;
        this.width = width;
        this.height = height;
        if (color >= Block.colorSet.length) {
            color = Block.colorSet.length - 1;
        }
        this.color = Block.colorSet[color];
        this.x = x;
        this.y = y;
    }

    /**
     * 描画処理するメソッド
     *
     * @param context CanvasRenderingContext2D
     */
    draw(context) {
        context.save();

        context.translate(this.x, this.y);
        context.fillStyle = this.color[0];
        context.fillRect(-(this.width / 2), -(this.height / 2),
            this.width, this.height);
        context.lineWidth = 4;
        context.strokeStyle = this.color[1];
        context.strokeRect(-(this.width / 2) + 2, -(this.height / 2) + 2,
            this.width - 4, this.height - 4);

        context.restore();
    }

    /**
     * ボールと当たったので消えます
     */



    hit(ball) {
        ball.removeTarget(this);
        this.manager.removeTarget(this);

        /**
         * スコアを表示。宿題です。
         */

        let tag=document.getElementById("score");
        let score = Number(tag.innerHTML);
        score += 1000;
        tag.innerHTML = score;
    }
}

class BlockManager {
    constructor(baseWidth, baseHeight) {
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.blockList = [];
    }

    stage1() {
        for (let x = 0; x < 7; x++) {
            for (let y = 0; y < 6; y++) {
                const color = parseInt(Math.random() * Block.colorSet.length);
                this.blockList.push(
                    new Block(this, this.baseWidth * (x + 1)
                        , this.baseHeight * (y + 1),
                        this.baseWidth, this.baseHeight, color));
            }
        }
    }

    removeTarget(object) {
        this.blockList.splice(this.blockList.indexOf(object), 1);
    }


    draw(context) {
        this.blockList.forEach((block) => {
            block.draw(context);
        }, this);
    }
}

class Ball {
    constructor(radius, color) {
        this.radius = radius;
        this.color = color;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.targetList = [];
    }

    /**
     * 当たり判定をするリストに追加する
     */
    addTarget(object) {
        if (Array.isArray(object)) {
            for (let i in object) {
                this.targetList.push(object[i]);
            }
        } else {
            this.targetList.push(object);
        }
    }

    removeTarget(object) {
        this.targetList.splice(this.targetList.indexOf(object), 1);
    }

    /**
     * 位置を指定した場所へ移動する
     * @param x
     * @param y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 移動速度と向きを指定する
     * @param speed
     * @param direction
     */
    setSpeed(speed, direction) {
        const rad = direction * Math.PI / 180;
        this.dx = Math.cos(rad) * speed;
        this.dy = Math.sin(rad) * speed;
    }

    /**
     * 移動のメソッド
     */
    move() {
        this.x += this.dx;
        this.y += this.dy;

        const side = this.collision();
        if ((side & 0x01) !== 0) {
            this.dx *= -1;
        }
        if ((side & 0x02) !== 0) {
            this.dy *= -1;
        }
    }

    /**
     * 衝突判定のメソッド
     */
    collision() {
        let collideSide = 0;
        this.targetList.forEach((target) => {
            if (collideSide !== 0) {
                return false;
            }

            const points = target.getCornerPoints();
            // 角チェック
            /*
             points.forEach((point) => {
             const a = Math.sqrt(
             Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2));
             if (a <= this.radius) {
             collideSide = 3;
             target.hit(this);
             }
             }, this);
             if (collideSide !== 0) {
             return false;
             }
             */

            // 各側面のチェック
            const bl = this.x - this.radius;
            const br = this.x + this.radius;
            const bt = this.y - this.radius;
            const bb = this.y + this.radius;
            if (points[0].x < br && bl < points[1].x) {
                if (points[0].y < bb && bt < points[2].y) {
                    target.hit(this);
                    const dl = Math.abs(points[0].x - br);
                    const dt = Math.abs(points[0].y - bb);
                    const dr = Math.abs(points[1].x - bl);
                    const db = Math.abs(points[2].y - bt);
                    const min = Math.min(dl, dt, dr, db);

                    if (min === dl || min === dr) {
                        collideSide += 1;
                    }
                    if (min === dt || min === db) {
                        collideSide += 2;
                    }
                }
            }
        }, this);

        return collideSide;
    }


    /**
     * 反射角度を変える(5度)
     */
    changeAngle(ccw = false) {
        let theta = Math.atan(this.dy / this.dx);
        const speed = this.dx / Math.cos(theta);
        if (ccw) {
            theta -= Math.PI * 5 / 180;
        } else {
            theta += Math.PI * 5 / 180;
        }

        if (theta <= -0.7853981634 || theta >= 0.5235987756) {
            // 変更なしにする
            return;
        }
        this.dx = Math.cos(theta) * speed;
        this.dy = Math.sin(theta) * speed;
    }

    /**
     * はみ出ないように位置を調整する
     */
    fixPosition() {
        // 画面左側を超えてるか判定と座標修正
        const left = this.x - this.radius;
        if (left < 0) {
            this.x += Math.abs(left);
            this.reflectionX();
        }

        // 画面上側を超えているか判定と座標修正
        const top = this.y - this.radius;
        if (top < 0) {
            this.y += Math.abs(top);
            this.reflectionY();
        }

        // 画面右側を超えているか判定と座標修正
        const right = this.x + this.radius;
        if (right > Breakout.width) {
            this.x -= right - Breakout.width;
            this.reflectionX();
        }

        // 画面下側を超えているか判定と一時的に座標修正
        if (top > Breakout.height) {
            Breakout.setGameOver();
        }
    }

    /**
     * 移動スピードの左右反転
     */
    reflectionX() {
        this.dx *= -1;
    }

    /**
     * 移動スピードの上下反転
     */
    reflectionY() {
        this.dy *= -1;
    }

    /**
     * 描画処理するメソッド
     *
     * @param context CanvasRenderingContext2D
     */
    draw(context) {
        // 移動関連
        this.move();
        this.fixPosition();

        // 描画関連
        context.save();

        context.fillStyle = this.color;
        context.translate(this.x, this.y);

        context.beginPath();
        context.arc(0, 0, this.radius, 0, 2 * Math.PI);
        context.fill();

        context.restore();
    }
}
