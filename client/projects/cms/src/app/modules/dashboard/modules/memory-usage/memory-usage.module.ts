import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MemoryUsageComponent} from './memory-usage.component';
import {RouterModule, Routes} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';


const routes: Routes = [
    {
        path: '',
        component: MemoryUsageComponent
    }
];


@NgModule({
    declarations: [
        MemoryUsageComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatToolbarModule,
    ]
})
export class MemoryUsageModule {
}
