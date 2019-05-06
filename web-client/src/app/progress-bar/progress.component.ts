import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'mk-progress-bar',
	templateUrl: './progress.component.html',
	styleUrls: ['./progress.component.scss']
})
export class ProgressBarComponent implements OnInit {

	constructor() {
	}

	ngOnInit() {
	}

	@Input()
	set visible(show: boolean) {
		if (show) {
			this._width = '0%';
			this._display = 'block';
			setTimeout(() => {
				this._width = '100%';
			}, 100);
		}
		else {
			this._display = 'none';
		}
	}

	_display = 'none';
	_width = '0%';
}
