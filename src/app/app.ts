import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer/footer';
import { Topnav } from './layout/topnav/topnav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Topnav, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('pinta');
}
