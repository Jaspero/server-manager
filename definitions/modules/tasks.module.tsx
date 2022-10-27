import {Collections} from '../interfaces/collections';
import {Module} from '../interfaces/module.interface';
import JSX from '../jsx.compiler';
import {CREATED_ON} from './shared/created-on';

export const TASKS_MODULE: Module = {
  id: Collections.Tasks,
  name: 'Tasks',
  layout: {
    editTitleKey: 'name',
    instance:{
      segments: [
        {
          fields: [
            '/name',
            '/file',
            '/devices',
            '/active'
          ]
        }
      ]

    },
    table: {
      tableColumns: [
        CREATED_ON.column(),
        {key: '/name', label: 'NAME'},
        {key: '/active', label: 'ACTIVE', control: true},
        {key: '/devices', label: 'DEVICE', control: true},
        {key: '/file', label: 'FILE', control: true},

      ]
    }
  },
  schema: {
    properties: {
      id: {type: 'string'},
      name: {type: 'string'},

      file: {type: 'string'},
      devices: {
        type: 'array'
      },
      active: {type: 'boolean'},
      ...CREATED_ON.property
    },
    required: [
      'name',
    ]
  },
  definitions: {
    name: {label: 'Name'},
    devices: {
      label: 'Device',
      component: {
        type: 'select',
        configuration: {
          multiple: true,
          populate: {
            collection: Collections.Devices
          }
        }
      }
    },
    file: {
      label: 'File',
      component: {
        type: 'file',
        configuration: {
          allowedFileTypes: ['application/zip']
        }
      }
    },
    ...CREATED_ON.definition()
  },
};
