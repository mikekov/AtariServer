import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// in config.js
declare var turboDivs: number[];

const ALL_FILES = 0;
const RECENT = 1;
const FAVORITES = 2;

interface FileItem {
	index?: number;
	id: number;
	name: string;
}

function getCookieValue(name: string): any {
	var arr = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)');
	return arr ? JSON.parse(arr.pop()) : null;
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
		this.progress(true);
		this.http.get<FileItem[]>('/api/files').subscribe(files => {
			this._files = files;
			this.filterChanged(this._filter);
			this.progress(false);
		}, err => {
			console.log('No files.', err);
			this._error = "No files available.";
			this.progress(false);
			if (isDevMode()) {
				this._files = [
					{id: 1, name: "BruceeLee.ATR"},
					{id: 2, name: "Boulder Dash.ATR"},
					{id: 3, name: "Great American Cross Country Road Race [file ver.].ATR"},
					{id: 4, name: "Montezuma's Revange.ATR"},
					{id: 5, name: "River Raid.ATR"},
					{id: 6, name: "Zorro.ATR"},
				];
				this.filterChanged(this._filter);
			}
		});

		this._recent = getCookieValue('recent') || [];
		this._favorite = getCookieValue('favorite') || [];
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

	// callback invoked when the user clicks on a file to load
	selectFile(file: FileItem) {
		if (this._progress) return;

		if (file && file.id === 0) {
			let found = false;
			for (let i = 0; i < this._files.length; ++i) {
				if (this._files[i].name === file.name) {
					file = this._files[i];
					found = true;
					break;
				}
			}
			if (!found) {
				file = null;
			}
		}

		this._error = "";

		if (file && this.currentFile !== file) {
			this.currentFile = file;
			const div = turboDivs[this._turbo].toString(); // Pokey divisor
			const hiboot = 1; // load hisio auto boot ATR
			this.progress(true);
			this.http.put<any>(`/api/insert?id=${file.id}&div=${this._turbo ? div : 40}&hisio=${hiboot}`, {}).subscribe(
				() => {
					/* ok */
					this.progress(false);
					if (this._tab !== RECENT) {
						this.addToRecent(file);
					}
				},
				err => {
					// todo
					console.log(err);
					this.progress(false);
					this._error = "Error loading file.";
			});
		}
		else {
			// selecting the same file again unloads it
			delete this.currentFile;
			this.progress(true);
			this.http.put<any>('/api/insert?id=0', {}).subscribe(() => { this.progress(false); /* ok */ }, err => { this.progress(false); this._error = "Error unloading file." });
		}
	}

	getFiles(): FileItem[] {
		switch (this._tab) {
			case 0:
				return this._filtered;
			case 1:
				return this._recent;
			case 2:
				return this._favorite;
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
		// const on = t > 0 ? '1' : '0'; // use turbo mode
		// const div = turboDivs[t].toString(); // Pokey divider
		// this.http.put('/turbo', null, {params: {divider: div, turbo: on} }).subscribe(() => { /* ok */ }, err => {});
	}

	addToRecent(file: FileItem) {
		this.addIfMissing(file, this._recent, true);
		// limit number of recent files
		if (this._recent.length > 10) {
			this._recent.pop();
		}
		this.save(this._recent, 'recent');
	}

	addToFavorite(file: FileItem) {
		this.addIfMissing(file, this._favorite, false);
		this.save(this._favorite, 'favorite');
	}

	addIfMissing(file: FileItem, list: FileItem[], promote: boolean) {
		if (!file || !list) return;

		let pos = -1;
		for (let i = 0; i < list.length; ++i) {
			if (list[i] && list[i].name == file.name) {
				pos = i;
				break;
			}
		}

		// add file to a list; don't store IDs, they can change
		if (promote) {
			if (pos > 0) {
				list.splice(pos, 1);
			}
			if (pos !== 0) {
				list.splice(0, 0, {name: file.name, id: 0});
			}
		}
		else {
			if (pos < 0) {
				list.push({name: file.name, id: 0});
			}
		}

		for (let i = 0; i < list.length; ++i) {
			list[i].index = i + 1;
		}
	}

	isSelected(item: FileItem): boolean {
		if (!item || !this.currentFile) return false;

		if (item.id === this.currentFile.id || item.id === 0 && item.name === this.currentFile.name) {
			return true;
		}

		return false;
	}


	save(object: any, name: string) {
		const value = JSON.stringify(object);
		document.cookie = name + "=" + value + "; path=/";
	}

	progress(on: boolean) {
		if (on) {
			this._progress++;
		}
		else {
			if (this._progress > 0) {
				this._progress--;
			}
		}
	}

	currentFile: FileItem | undefined;
	title = 'atari-drive';
	_turbo = 0;
	_filter = '';
	_files: FileItem[] = [];
	_filtered: FileItem[] = [];
	_recent: FileItem[] = [];
	_favorite: FileItem[] = [];
	_none = [];
	_tab = 0;
	_progress = 0;
	_error = "";
}
