import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'ata-drive',
	templateUrl: './drive.component.html',
	styleUrls: ['./drive.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class DriveComponent implements OnInit {

	@Input() scale = 1;
	@Input() floppy = true;
	@Input() message = "";
	@Input() image = "";
	@Input() drive = "";
	@Input() filename = "";

	constructor() { }

	ngOnInit() {
	}

}
