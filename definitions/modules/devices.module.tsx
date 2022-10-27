import {Collections} from '../interfaces/collections';
import {Module} from '../interfaces/module.interface';
import JSX from '../jsx.compiler';
import {CREATED_ON} from './shared/created-on';

export const DEVICES_MODULE: Module = {
  id: Collections.Devices,
  name: 'Devices',
  layout: {
    editTitleKey: 'name',
    instance: {
      segments: [
        {
          fields: [
            '/name',
            '/description',
            '/online',
            '/password'
          ]
        }
      ]
    },
    table: {
      tableColumns: [
        CREATED_ON.column(),
        {key: '/name', label: 'NAME', sortable: true},
        {key: '/description', label: 'DESCRIPTION'},
        {key: '/online', label: 'ONLINE'}
      ]
    }
  },
  schema: {
    properties: {
      id: {type: 'string'},
      name: {type: 'string'},
      description: {type: 'string'},
      online: {type: 'boolean'},
      password: {type: 'string'},
      ...CREATED_ON.property
    },
    required: [
      'name',
      'password',
      'online',
    ]
  },
  definitions: {
    name: {
      label: 'Name',
    },
    description: {
      label: 'Description',
      component: {
        type: 'textarea'
      }
    },
    online: {label: 'online'},
    ...CREATED_ON.definition()
  }
};
