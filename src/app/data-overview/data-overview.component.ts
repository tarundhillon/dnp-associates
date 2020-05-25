import { Component, OnInit } from '@angular/core';
import {selection, select, event as d3Event} from "d3-selection";
import "d3-selection-multi";
import { fromEvent } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
@Component({
  selector: 'app-data-overview',
  templateUrl: './data-overview.component.html',
  styleUrls: ['./data-overview.component.scss'],
  host: {'(window:resize)': 'makeViz(config)'}
})
export class DataOverviewComponent implements OnInit {
  public config = {
    id: '#container',
    grid: { width: 50, height: 50},
    points: {
      radius: 10,  
      list:[
        {id: 1, row:2, col:3, connectedTo:[]},
        {id: 2, row:5, col:6, fill:true, group: 'blueGroup', connectedTo:[5,6]},
        {id: 3, row:3, col:2, connectedTo:[]},
        {id: 4, row:0, col:5, connectedTo:[]},
        {id: 5, row:1, col:5, fill:true, color: 'blueGroup'},
        {id: 6, row:1, col:7, fill:true, color: 'blueGroup'},
        {id: 7, row:2, col:6, fill:true, connectedTo:[]},
        {id: 8, row:4, col:3, fill:true, connectedTo:[11,13]},
        {id: 9, row:5, col:4, connectedTo:[]},
        {id: 10, row:4, col:5, connectedTo:[]},
        {id: 11, row:3, col:7, fill:true, connectedTo:[]},
        {id: 12, row:3, col:4, connectedTo:[]},
        {id: 13, row:3, col:5, fill:true, connectedTo:[6]}
      ]
  }

  }
  constructor() { }

  ngOnInit(): void {
    console.log(select('#container'));
    this.makeViz(this.config);
  }


  makeViz(_config: any){
    const container = select(_config.id);
    let {offsetHeight:height, offsetWidth:width} = container['_groups'][0][0];
    height = Math.floor(height / _config.grid.height) * _config.grid.height;
    width = Math.floor(width / _config.grid.width) * _config.grid.width;

    const svg = container
    .html('')
    .append('svg')
      .attr('viewBox',`0 0  ${width} ${height}`)
      .attr('height',height)
      .attr('width',width);

    const gridBox = {
      x : Math.floor(width/_config.grid.width),
      y : Math.floor(height/_config.grid.height)};

    const grid = {
      x: new Array(gridBox.x+1).fill(0).map((o,i)=>_config.grid.width*i),
      y: new Array(gridBox.y+1).fill(0).map((o,i)=>_config.grid.height*i)};

      this.makeGridLine(svg,grid, height,width);
      this.makePoints(svg,grid,_config);

      const keyDowns = fromEvent(document, 'keydown');
      let keyPresses = keyDowns.pipe(
        tap(console.log),
        filter((e: KeyboardEvent) => e.key === 'ArrowRight' || e.key === 'ArrowLeft'),
        tap(e=>{
          if(e.key === 'ArrowRight') this.playAnimation(svg,_config)
          if(e.key === 'ArrowLeft') this.playAnimation(svg,_config, -1)
        })
      ).subscribe();
      
      // svg.on('keypress',()=>{
      //   if(d3Event.keyCode === 13) this.playAnimation(svg, _config);
      // });

      console.log({container, grid, height, width});
  
  }

  connectLines(svg,_config){
    _config.points.list
      .filter(obj=>obj.connectedTo)
      .forEach(point=>{
        point.connectedTo.forEach(target=>{
          const targetObj = _config.points.list.find(o=>o.id === target);
          this.drawConnectors(svg,point, targetObj,_config);
        });
      })
  }

  drawConnectors(svg,source,target, _config){
    let sourceItem = select(`[point-id='${source.id}']`); 
    const sX  = parseInt(sourceItem.attr('cx'));
    const sY  = parseInt(sourceItem.attr('cy'));
    let targetItem = select(`[point-id='${target.id}']`); 
    const tX  = parseInt(targetItem.attr('cx'));
    const tY  = parseInt(targetItem.attr('cy'));
    console.log({sX,sY,tX,tY});

    
    const eX = tX > sX
      ? (source.col+1) * _config.grid.width
      : (source.col) * _config.grid.width;

    this.drawLine(svg,sX,eX,sY,sY,source.group); // left or right edge 
    
    if(Math.abs(eX - tX) <= _config.grid.width) {// reach same height if adjcent box
      this.drawLine(svg,eX,eX,sY,tY,source.group); 
      this.drawLine(svg,eX,tX,tY,tY,source.group);
    }
    else {
      const eY = (target.row+1) * _config.grid.height;
      this.drawLine(svg,eX,eX,sY,eY,source.group);
      this.drawLine(svg,eX,tX,eY,eY,source.group);
      this.drawLine(svg,tX,tX,eY,tY,source.group);
    }



  }

  drawLine(svg,x1,x2,y1,y2, group=''){
    svg.append('line')
    .transition() 
    .attr('group',group)
    .attr('class','connector')
    .attr('x1',x1)
    .attr('x2',x2)
    .attr('y1',y1)
    .attr('y2',y2)
    .duration(200);
  }

  getCordinates(obj){
    obj.row
  }

  playAnimation(svg, _config, direction = 1){
    
    svg.selectAll('.point[fill-attr="true"]')
      .transition() 
      .attr('point-fill', ()=> direction > 0 ?  'true' : 'false')
      .attr('r',_config.points.radius)
      .delay((d,i)=>250*i)
      .duration(2000)
    this.connectLines(svg,_config);
  }

  makePoints(svg, grid, _config){
    svg
    .append('g')
      .attr('class', 'points')
      .selectAll('circle')
      .data(_config.points.list)
      .enter()  
    .append('circle')
      .attr('class','point')
      .attr('fill-attr',d=>d.fill)
      .attr('group',d=>d.group ? d.group : '')
      .attr('point-id',d=>d.id)
      .attr('cx',d=>{
        let x = grid.x.length > d.col ? grid.x[d.col] : 0;
        return x + _config.grid.width / 2;
      })
      .attr('cy',d=>{
        let y = grid.y.length > d.row ? grid.y[d.row] : 0;
        return y + _config.grid.height / 2;
      })
      .attr('r',0)
      .transition() 
      .attr('r',_config.points.radius)
      .delay((d,i)=>100*i)
      .duration(1000)
  }

  makeGridLine(svg,grid,height, width){
    svg.append('g')
    .attr('class','grid line x')
    .selectAll('line')
    .data(grid.y)
    .enter()
    .append('line')
      .attr('x1',0)
      .attr('x2', width)
      .attr('y1',d=>d)
      .attr('y2',d=>d)
      svg.append('g')
      .attr('class','grid line y')
      .selectAll('line')
      .data(grid.x)
      .enter()
      .append('line')
        .attr('x1',d=>d)
        .attr('x2', d=>d)
        .attr('y1',0)
        .attr('y2',height)

  }

}
