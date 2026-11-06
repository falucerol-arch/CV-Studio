import React from 'react';
import {Document,Page,View} from '@react-pdf/renderer';

export function ExecutivePdfLayout({title,author,pageSize,header,content,font,padding=48}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font}} wrap><View style={{marginBottom:8}}>{header}</View>{content}</Page></Document>;
}

export function TechnologyPdfLayout({title,author,pageSize,header,sidebar,main,width=32,font,margin=0}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding:margin,fontFamily:font,fontSize:9,color:'#25323a'}} wrap><View style={{flexDirection:'row',flexGrow:1}}><View style={{width:`${width}%`,padding:23,backgroundColor:'#14242e',color:'#f0f7fa'}}>{sidebar}</View><View style={{flexGrow:1,padding:31}}>{header}{main}</View></View></Page></Document>;
}

export function EditorialPdfLayout({title,author,pageSize,header,main,aside,font,padding=46}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font,color:'#352b27'}} wrap><View style={{marginBottom:13}}>{header}</View><View style={{flexDirection:'row',alignItems:'flex-start'}} wrap><View style={{width:'68%',paddingRight:17}}>{main}</View><View style={{width:'32%',paddingLeft:13,borderLeftWidth:1,borderLeftColor:'#e4dcd5'}}>{aside}</View></View></Page></Document>;
}

export function MinimalPdfLayout({title,author,pageSize,header,content,font,padding=54}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font,color:'#303943'}} wrap><View style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:'#dfe3e6',marginBottom:6}}>{header}</View>{content}</Page></Document>;
}

export function CreativePdfLayout({title,author,pageSize,header,content,font,accent,padding=38}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font,color:'#272b32'}} wrap><View style={{padding:17,marginBottom:11,backgroundColor:accent,borderRadius:8,color:'#fff'}}>{header}</View>{content}</Page></Document>;
}

export function ChronologicalPdfLayout({title,author,pageSize,header,content,font,padding=42}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font,color:'#29363a'}} wrap><View style={{paddingBottom:13,marginBottom:4,borderBottomWidth:2,borderBottomColor:'#327d78'}}>{header}</View>{content}</Page></Document>;
}

export function AtsPdfLayout({title,author,pageSize,header,content,font,padding=44}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font,color:'#202326'}} wrap><View style={{paddingBottom:10,marginBottom:4,borderBottomWidth:2,borderBottomColor:'#222'}}>{header}</View>{content}</Page></Document>;
}

export function ModernPdfLayout({title,author,pageSize,header,sidebar,main,font,width=30,sideRight=false,padding=0}){
  return <Document title={title} author={author}><Page size={pageSize} style={{padding,fontFamily:font}} wrap><View style={{flexDirection:sideRight?'row-reverse':'row',flexGrow:1}}><View style={{width:`${width}%`,padding:22,backgroundColor:'#252b48',color:'#f5f4ff'}}>{sidebar}</View><View style={{flexGrow:1,padding:30}}>{header}{main}</View></View></Page></Document>;
}
