import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// in config.js
declare var turboDivs: number[];

interface FileItem {
	id: number;
	name: string;
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
	constructor(
		private http: HttpClient,
		private changes: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.http.get<FileItem[]>('/files').subscribe(files => {
			this._files = files;
			this.filterChanged(this._filter);
		}, err => {
			console.log('No files.', err);
			this._files = [
				{id: 1, name: "BruceeLee.ATR"},
				{id: 2, name: "Boulder Dash.ATR"},
				{id: 3, name: "Great American Cross Country Road Race [file ver.].ATR"},
				{id: 4, name: "Montezuma's Revange.ATR"},
				{id: 5, name: "River Raid.ATR"},
				{id: 6, name: "Zorro.ATR"},
			];
			this.filterChanged(this._filter);
		});
	}

	getFileName(fname: string): string {
		if (!fname) return '';

		const dot = fname.lastIndexOf('.');
		return dot > 0 ? fname.substr(0, dot) : fname;
	}

	getFileNameExt(fname: string): string {
		if (!fname) return '';

		const dot = fname.lastIndexOf('.');
		return dot > 0 ? fname.substr(dot) : '';
	}

	selectTab(tab: number) {
		this._tab = tab;
	}

	selectFile(file: FileItem) {
		//
		if (this.currentFile !== file) {
			this.currentFile = file;
			this.http.put<any>(`/insert/${file.id}`, {}).subscribe(() => { /* ok */ }, err => {
				// todo
				console.log(err);
			});
		}
		else {
			delete this.currentFile;
			this.http.put<any>('/insert/0', {}).subscribe(() => { /* ok */ }, err => {});
		}
	}

	getFiles(): FileItem[] {
		switch (this._tab) {
			case 0:
				return this._filtered;
		}
		return this._none;
	}

	clearFilter() {
		this.filterChanged('');
	}

	filterChanged(filter: string) {
		this._filter = filter;
		if (!filter) {
			this._filtered = this._files;
		}
		else {
		//	console.log(filter);
			const f = filter.toLowerCase();
			this._filtered = this._files.filter(file => file.id.toString().includes(f, 0) || file.name.toLowerCase().includes(f, 0));
		}

	}

	setTurbo(t: number) {
		this._turbo = t;
		const on = t > 0 ? '1' : '0'; // use turbo mode
		const div = turboDivs[t].toString(); // Pokey divider
		this.http.put('/turbo', null, {params: {divider: div, turbo: on} }).subscribe(() => { /* ok */ }, err => {});
	}

	currentFile: FileItem | undefined;
	title = 'atari-drive';
	_turbo = 2;
	_filter = '';
	_files: FileItem[] = [];
	_filtered: FileItem[] = [];
	_none = [];
	_tab = 0;
}
