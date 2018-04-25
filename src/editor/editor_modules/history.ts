export class History {

    public redo_list: Array<string> = [];
    public undo_list: Array<string> = [];
    private cvs: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private preview: HTMLDivElement;
   
    constructor(ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement, preview: HTMLDivElement) {
        this.ctx = ctx;
        this.cvs = cvs;
        this.preview = preview;
    }

    public saveState(list: Array<any>, keep_redo: Boolean) {
      keep_redo = keep_redo || false;
      if(!keep_redo) {
        this.redo_list = [];
      }  
      (list || this.undo_list).push(this.cvs.toDataURL());   
    }

    public undo() {
        this.restoreState(this.undo_list, this.redo_list);
    }
    public redo() {
        this.restoreState(this.redo_list, this.undo_list);
    }
    private restoreState(pop: Array<any>, push: Array<any>) {
      if(pop.length) {
        this.saveState(push, true);
        var restore_state = pop.pop();
        var img = new Image();
        var cvs = this.cvs;
        var ctx = this.ctx;
        var preview = this.preview;
        img.src = restore_state;
        img.onload = function() {
          ctx.clearRect(0, 0, cvs.width, cvs.height);
          ctx.drawImage(img, 0, 0, cvs.width, cvs.height, 0, 0, cvs.width, cvs.height); 
          preview.style.backgroundImage = 'url(' + cvs.toDataURL("image/png"); + ')';
        }
      }
    }
}