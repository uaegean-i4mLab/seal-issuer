export default class LinkRequest{

    constructor(datasetA, datasetB){
        this.id = null
        this.issuer = null
        this.type= null
        this.lloa= null
        this.issued= null
        this.expiration = null
        this.datasetA = datasetA
        this.datasetB = datasetB
        this.evidence = null
        this.conversation = []
        /*
          self.id = str
        self.issuer = str
        self.type = str
        self.lloa = str
        self.issued = str
        self.expiration = str
        self.datasetA = Dataset()
        self.datasetB = Dataset()
        self.evidence = [FileObject()]
        self.conversation = [ChatMessage()]
        */
    }


}