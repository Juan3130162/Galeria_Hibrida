import { Injectable } from '@angular/core';
import { Camera, CameraPhoto, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Foto } from '../models/foto.interface'

@Injectable({
  providedIn: 'root'
})
export class FotoService {
  // Arreglo para almacenar fotos
  public fotos: Foto[] = [];
  private PHOTO_STORAGE: string = 'fotos';
  constructor() { }

  public async addNewToGallery() {
    // Take a photo
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    })

    /*this.fotos.unshift({
      filepath: 'foto_',
      webviewPath: fotoCapturada.webPath
    })*/
   const saveImageFile = await this.savePicture(fotoCapturada);
   this.fotos.unshift(saveImageFile);
  Preferences.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.fotos)
  })
  }

  public async savePicture(cameraPhoto: CameraPhoto) {
    // Convertir la foto a base64
    const base64Data = await this.readAsBase64(cameraPhoto);
    // Guardar la foto en el sistema de archivos
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });
    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }

  public async readAsBase64(cameraPhoto: CameraPhoto) {
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    return await this.convertBlobToBase64(blob) as string;
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => { 
      resolve(reader.result) 
    };
    reader.readAsDataURL(blob);
  })

  public async loadSaved() {
    // Recuperar las fotos de la memoria cache
    const listaFoptos = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.fotos = JSON.parse(listaFoptos.value!) || [];

    //bucle para desplegar las fotos leidas en formato base64
    for (let foto of this.fotos) {
      //leer cada foto del sistema de archivos
      const readFile = await Filesystem.readFile({
        path: foto.filepath,
        directory: Directory.Data
      });
      //solo para plataformas web, sin esta linea igual se cargan las fotos en android y ios
      foto.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }
}
