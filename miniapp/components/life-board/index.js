const { board } = require("../../content/index");
Component({
  properties: {
    position: { type: Number, value: 0 },
    preview: { type: Boolean, value: false },
    moving: Boolean,
    dice: Number,
  },
  data: { tiles: board },
  methods: {
    tap(e) {
      this.triggerEvent("tile", { id: e.currentTarget.dataset.id });
    },
  },
});
