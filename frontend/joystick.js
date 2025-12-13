class Joystick {
    constructor(canvasId, onChange) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onChange = onChange;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = 80;
        this.handleRadius = 20;
        this.handleX = this.centerX;
        this.handleY = this.centerY;
        this.isDragging = false;

        this.canvas.addEventListener('mousedown', this.startDrag.bind(this));
        this.canvas.addEventListener('mousemove', this.drag.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrag.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrag.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.startDragTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.dragTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrag.bind(this));

        this.draw();
    }

    startDrag(event) {
        event.preventDefault();
        this.isDragging = true;
        this.updatePosition(event.clientX, event.clientY);
    }

    drag(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        this.updatePosition(event.clientX, event.clientY);
    }

    stopDrag() {
        this.isDragging = false;
        this.handleX = this.centerX;
        this.handleY = this.centerY;
        this.draw();
        this.onChange(0, 0);
    }

    startDragTouch(event) {
        event.preventDefault();
        this.isDragging = true;
        const touch = event.touches[0];
        this.updatePosition(touch.clientX, touch.clientY);
    }

    dragTouch(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        const touch = event.touches[0];
        this.updatePosition(touch.clientX, touch.clientY);
    }

    updatePosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left - this.centerX;
        const y = clientY - rect.top - this.centerY;
        const distance = Math.sqrt(x * x + y * y);
        if (distance > this.radius) {
            this.handleX = this.centerX + (x / distance) * this.radius;
            this.handleY = this.centerY + (y / distance) * this.radius;
        } else {
            this.handleX = this.centerX + x;
            this.handleY = this.centerY + y;
        }
        this.draw();
        const normalizedX = (this.handleX - this.centerX) / this.radius;
        const normalizedY = (this.handleY - this.centerY) / this.radius;
        this.onChange(normalizedX, normalizedY);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw base
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.stroke();
        // Draw handle
        this.ctx.beginPath();
        this.ctx.arc(this.handleX, this.handleY, this.handleRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#666';
        this.ctx.fill();
    }
}

// Initialize joysticks
let leftJoystick, rightJoystick;

function initJoysticks(onLeftChange, onRightChange) {
    leftJoystick = new Joystick('left-joystick', onLeftChange);
    rightJoystick = new Joystick('right-joystick', onRightChange);
}