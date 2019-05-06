import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { AppComponent } from './app.component';
import { DriveComponent } from './drive/drive.component';
import { ProgressBarComponent } from './progress-bar/progress.component';

@NgModule({
  declarations: [
    AppComponent, DriveComponent, ProgressBarComponent
  ],
  imports: [
    BrowserModule, HttpClientModule, VirtualScrollerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
