import _ from 'lodash';

import { dataDeprecated } from '../../data/index';

import { osmIsInterestingTag } from './tags';
import { Entity } from './entityStatic';

var debug = false;

export var entityBase = {
    tags: {},

    initialize: function(sources) {
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            for (var prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    if (source[prop] === undefined) {
                        delete this[prop];
                    } else {
                        this[prop] = source[prop];
                    }
                }
            }
        }

        if (!this.id && this.type) {
            this.id = Entity.id(this.type);
        }
        if (!this.hasOwnProperty('visible')) {
            this.visible = true;
        }

        if (debug) {
            Object.freeze(this);
            Object.freeze(this.tags);

            if (this.loc) Object.freeze(this.loc);
            if (this.nodes) Object.freeze(this.nodes);
            if (this.members) Object.freeze(this.members);
        }

        return this;
    },

    // copy: function(resolver, copies) {
    //     if (copies[this.id])
    //         return copies[this.id];

    //     var copy = Entity(this, {id: undefined, user: undefined, version: undefined});
    //     copies[this.id] = copy;

    //     return copy;
    // },

    osmId: function() {
        return Entity.id.toOSM(this.id);
    },

    isNew: function() {
        return this.osmId() < 0;
    },

    // update: function(attrs) {
    //     return Entity(this, attrs, {v: 1 + (this.v || 0)});
    // },

    mergeTags: function(tags) {
        var merged = _.clone(this.tags),
            changed = false;
        for (var k in tags) {
            var t1 = merged[k],
                t2 = tags[k];
            if (!t1) {
                changed = true;
                merged[k] = t2;
            } else if (t1 !== t2) {
                changed = true;
                merged[k] = _.union(t1.split(/;\s*/), t2.split(/;\s*/)).join(
                    ';'
                );
            }
        }
        return changed ? this.update({ tags: merged }) : this;
    },

    intersects: function(extent, resolver) {
        return this.extent(resolver).intersects(extent);
    },

    isUsed: function(resolver) {
        return (
            _.without(Object.keys(this.tags), 'area').length > 0 ||
            resolver.parentRelations(this).length > 0
        );
    },

    hasInterestingTags: function() {
        return _.keys(this.tags).some(osmIsInterestingTag);
    },

    isHighwayIntersection: function() {
        return false;
    },

    isDegenerate: function() {
        return true;
    },

    deprecatedTags: function() {
        var tags = _.toPairs(this.tags);
        var deprecated = {};

        dataDeprecated.forEach(function(d) {
            var match = _.toPairs(d.old)[0];
            tags.forEach(function(t) {
                if (
                    t[0] === match[0] &&
                    (t[1] === match[1] || match[1] === '*')
                ) {
                    deprecated[t[0]] = t[1];
                }
            });
        });

        return deprecated;
    }
};